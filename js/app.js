/**                       CITY MODEL
 *
 *               city locations properties (lat and lng).
 */
var City = function(lat, lng) {
    this.lat = lat;
    this.lng = lng;
};

/**                        GOOGLE MODEL
 *
 *                    google map and markers
 */
var Google = function() {
    var self = this;
    this.map;
    this.markerList = [];
    this.addmarker = function(resturant) {
        this.markerList.push(resturant);
    };

};

/**                         RESTURANT MODEL
 *
 *              all properties needed for rendering a resturant.
 */
var Resturant = function(name, marker, info, rating, locationImg, infoWindow, phone, homepage, category) {
    this.name = name;
    this.marker = marker;
    this.info = info;
    this.infoWindow = infoWindow;
    this.rating = rating;
    this.locationImg = locationImg;
    this.fourSquareData = [];
    this.updatefourSquareData = function(phone, homepage, category) {
        this.fourSquareData.push({
            "category": category,
            "phone": phone,
            "homepage": homepage
        });
    };
};

/**                         APPVieWMODEL
 *
 */
var AppViewModel = function() {
    var self = this;
    this.currentCity = ko.observable('');
    this.newcity = ('new york'); /**TODO: make this dynamical with a knockout searchfield. So user can change address.*/
    this.bounds;
    this.resturantList = ko.observableArray();
    this.searchText = ko.observable('');
    this.errorForsquare = false;

    /**filteredList is a dynamical updated list and depends on searchText which end-user edits*/
    this.filteredList = ko.computed(function() {
        var filter = self.searchText();
        /** if searchText empty */
        if (!filter) {
            ko.utils.arrayFilter(self.resturantList(), function(item) {
                /** add showmarkeronmap function on each item, observable is added to each item when application loads for the first time.
                 *   when user click on item in list it will open infowindow on map and minimize filter menu.
                 */
                item.marker.setVisible(true);
                this.item = ko.observable(item.name), this.showMarkerOnMap = function(obj) {
                    obj.infoWindow.setContent(obj.info);
                    obj.infoWindow.open(self.google.map, obj.marker);
                    self.google.map.setCenter(obj.marker.getPosition());
                    obj.marker.setAnimation(google.maps.Animation.BOUNCE);
                    $('.filter-map-content').hide();
                    $('.menu-button').show();
                    $('.responsive-menu').removeClass('expand');
                }
            });
            return self.resturantList();
        } else {
            /** if searchText contains something
             */
            return ko.utils.arrayFilter(self.resturantList(), function(item) {
                item.infoWindow.close();
                if (self.stringStartsWith(item.name.toLowerCase(), filter) === true) {
                    item.marker.setVisible(true);
                    return self.stringStartsWith(item.name.toLowerCase(), filter);
                    /**return items that starts with searchText */
                } else {
                    /**setVisible false on all items that not match searchText*/
                    item.marker.setVisible(false);

                }

            })

        }
    });

    /**                         API FUNCTIONS */

    /**
     * @description Get lat and lng position for a string.
     * @param {string} address - name of an address
     * @param {function} callback function
     * @returns {object} google result object 
     */
    this.apiGeocodeAddress = function GeocodeAddress(address, callback) {
        geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 'address': address }, callback);
    };

    /**
     * @description get places in a predefined radius nearby a city. Api function is filtered to search for food with keyword vegan via google places service.
     * @param {object} city - city object
     * @param {object} map google map object
     * @param {function} callback function
     * @returns {array} array of objects 
     */
    this.apiGetPlaces = function GetPlaces(city, map, callback) {
        if (typeof callback === 'function') {
            service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
                location: city,
                radius: 1500,
                type: ['food'],
                keyword: ['vegan']
            }, callback);
        }
    };

    /**
     * @description  Get forsquare information for a resturant at specified position and update the resturant object with new info.
     * function will call apicallbFourSquare to update resturant object async.
     * @param {object} resturant 
     * @param {object} lat
     * @param {object} lng
     * @param {string} resturantname
     * 
     */
    this.apiFourSquare = function FourSquare(resturant, lat, lng, resturantname) {
        var fs = 'https://api.FourSquare.com/v2/venues/search?client_id=EDO0PU442DM5XJU3RGBJXJDOVLHTHRNJGMDQACDEFR32WHTR&client_secret=3UNC4A1BANUZHB4H0SDHZQOGDNQORSI2MGNIYXLVSMRZFYC4&v=20150321&ll=' + lat + ',' + lng + '&query=' + resturantname + '&limit=1'
        $.getJSON(fs).done(function(result) {
            var phone, homepage, category;
            /** if result property does not exist. catch and save variable as undefined */
            try { phone = result.response.venues[0].contact.formattedPhone; } catch (err) {
                phone = undefined;
            }
            try { category = result.response.venues[0].categories[0].shortName; } catch (err) {
                category = undefined;
            }
            try { homepage = result.response.venues[0].url; } catch (err) {
                homepage = undefined;
            }

            self.apicallbFourSquare(resturant, phone, category, homepage)
        }).fail(function(jqxhr, textStatus, error) {
            if (self.errorForsquare !== true) {
                /**self.errorForsquare is used to notify user only once about API Failure instead of every object*/
                self.errorForsquare = true;
                alert('issue getting FourSquare data. Resturants will be missing FourSquare data')
            }
        });
    }

    /**
     * @description  Callback Function will Update resturant object and infowindow with forSquare data.
     * @param {object} resturant
     * @param {string} phone
     * @param {string} category
     * @param {string} homepage
     *
     */
    this.apicallbFourSquare = function FourSquareResponse(resturant, phone, category, homepage) {
        resturant.updatefourSquareData(self.removeUndefined(phone), self.removeUndefined(homepage), self.removeUndefined(category));
        self.updateInfoWindow(resturant);
    }

    /**                            APP HELP FUNCTIONS
     *
     */

    /**
     * @description  Function will Update resturant object and infowindow with new forSquare data.
     * @param {object} resturant
     *
     */
    this.updateInfoWindow = function updateInfoWindow(resturant) {
        var hp;
        if (resturant.fourSquareData[0].homepage === 'n/a') {
            var hp = '<p><strong>homepage : </strong>n/a</p>';
        } else {
            var hp = '<p><strong>homepage : </strong><a href="' + resturant.fourSquareData[0].homepage + '">' + resturant.fourSquareData[0].homepage + '</p>';
        }

        var content = '<div class="content"><h1>' + resturant.name + '</h1>' + '<p><strong>Rating: </strong>' + resturant.rating +
            '</p>' + '<p><strong>Category: </strong>' + resturant.fourSquareData[0].category + '</p>' + '<p><strong>Phone: </strong>' +
            resturant.fourSquareData[0].phone + '</p>' + hp + '<img src="' + resturant.locationImg + '">';

        resturant.info = content;
        google.maps.event.addListener(resturant.marker, 'click', function() {
            resturant.infoWindow.setContent(content);
            resturant.infoWindow.open(self.google.map, this);
            resturant.marker.setAnimation(google.maps.Animation.BOUNCE);
        });

    };

    /**
     * @description  Function will loop resturantList and call apiFourSquare function to update resturant objects with new info.
     *
     */
    this.addFSinfo = function() {
        ko.utils.arrayForEach(self.resturantList() || [], function(item) {
            self.apiFourSquare(item, item.marker.getPosition().lat(), item.marker.getPosition().lng(), item.name)

        });

    };

    /** verify if string startswith startswith, return true or false */
    this.stringStartsWith = function(string, startsWith) {
        string = string || '';
        if (startsWith.length > string.length)
            return false;
        return string.substring(0, startsWith.length) === startsWith;
    };

    this.removeUndefined = function(object) {
        if (object === undefined) {
            return 'n/a'
        } else {
            return object
        }
    };

    /**resize map to fit bounds */
    this.responsiveMap = function(width) {
        self.google.map.fitBounds(self.bounds);
    }

    //** newcity has to be decoded before program starts, geocode newcity location and then start init()*/
    this.apiGeocodeAddress(this.newcity, function callback(results, status) {
        try {
            self.currentCity = new City(results[0].geometry.location.lat(), results[0].geometry.location.lng());
        } catch (err) {
            alert('Error loading GoogleMap. Address could not be geocoded.')
        }
        init();
    })

    /** INIT() starts from this.apiGeoCodeAddress function. */
    function init() {
        try {
            self.google = new Google()
            self.google.map = new google.maps.Map(document.getElementById('map'), {
                zoom: 10,
                center: self.currentCity,
                // style found at snazzy maps: https://snazzymaps.com/style/15883/green-canvas
                styles: [{ "featureType": "all", "elementType": "geometry", "stylers": [{ "color": "#8dc04a" }] }, { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "gamma": 0.01 }, { "lightness": 20 }] }, { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "saturation": -31 }, { "lightness": -33 }, { "weight": 2 }, { "gamma": 0.8 }] }, { "featureType": "all", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "lightness": 30 }, { "saturation": 30 }] }, { "featureType": "poi", "elementType": "geometry", "stylers": [{ "saturation": 20 }] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "lightness": 20 }, { "saturation": -20 }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "lightness": 10 }, { "saturation": -30 }] }, { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "saturation": 25 }, { "lightness": 25 }] }, { "featureType": "water", "elementType": "all", "stylers": [{ "lightness": -20 }] }]
            })

        } catch (err) {
            $('#map-error').text('GoogleMap could not be loaded')
            alert('could not load googlemap')
        }

        /** Take place information from placesService and save it to resturantList as Resturant Objects. */
        self.apiGetPlaces(self.currentCity, self.google.map, function callback(results, status) {
            self.bounds = new google.maps.LatLngBounds();
            var infoWindow = new google.maps.InfoWindow();

            ko.utils.arrayForEach(results || [], function(item) {
                var marker;
                self.google.addmarker(marker = new google.maps.Marker({
                    position: item.geometry.location,
                    map: self.google.map,
                    title: item.title,
                    animation: google.maps.Animation.DROP
                }));
                /** save url for street picture to use in infoWindow. */
                var locationUrl = 'https://maps.googleapis.com/maps/api/streetview?size=300x150&location=' + item.geometry.location.lat() + ',' + item.geometry.location.lng() + '&heading=151.78&pitch=-0.76&key=AIzaSyAMr4cPC9-zPpNLCk1yngw1ijaFQ2z-rxM'
                var info = '<div class="content"><h1>' + item.name + '</h1>' + '<p><strong>Rating: </strong>' + item.rating + '</p>' + '<img src="' + locationUrl + '">'
                self.resturantList.push(new Resturant(item.name, marker, info, self.removeUndefined(item.rating), locationUrl, infoWindow, 'NA', 'NA', 'NA'));

                /** add listeners for each result. */
                google.maps.event.addListener(marker, 'click', function() {
                    infoWindow.setContent(info);
                    infoWindow.open(self.google.map, this);
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                    self.google.map.setCenter(marker.getPosition());
                });

            }); /** End ko loop */

            /** add listeners for map. close infowindow if user click on map. */
            google.maps.event.addListener(self.google.map, 'click', function() {
                infoWindow.close();
            });

            /** center googlemap to the result of all markers. */
            for (var i = 0; i < self.google.markerList.length; i++) {
                self.bounds.extend(self.google.markerList[i].getPosition());
            }
            self.google.map.fitBounds(self.bounds);

            /**add foursquare information to resturants. */
            self.addFSinfo();
        });
    } /** init end */
}

function initialize() {
    /** 
     * start application when google library script been loaded.
     * jquery adds eventlisteners to buttons and solve an responsive mobile issue regarding resizing map. */
    $('.menu-button').click(function() {
        $('.filter-map').show();
        $('.responsive-menu').toggleClass('expand');
        $('.menu-button').hide();
    });
    $('.close-button').click(function() {
        $('.filter-map').hide();
        $('.menu-button').show();
        $('.responsive-menu').removeClass('expand');
    });
    /** resize window with timeout (if not used application will send API requests x 1000 and block account from API requests) */
    /** Thanks to this thread, https://stackoverflow.com/questions/2854407/javascript-jquery-window-resize-how-to-fire-after-the-resize-is-completed */
    $(window).bind('resize', function(e) {
        window.resizeEvt;
        $(window).resize(function() {
            clearTimeout(window.resizeEvt);
            window.resizeEvt = setTimeout(function() {
                /** send viewport width and center map with responsiveMap function. */
                var viewportWidth = $(window).width();
                app.responsiveMap(viewportWidth);
            }, 500);
        });
    });
    var app;
    ko.applyBindings(app = new AppViewModel);
}