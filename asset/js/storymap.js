    (function ($) {
    'use strict';


    $.fn.storymap = function(options) {

        var defaults = {
            selector: '[data-place]',
            breakpointPos: '33.333%',
            createMap: function () {
                // create a map in the "map" div, set the view to a given place and zoom
                var map = L.map('map').setView([-8.245, 117.987], 11);

                // add an OpenStreetMap tile layer
                L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);

                return map;
            },
            markerOptions: {
              radius: 5,
              color: '#de2d26'
            },
            clustering: true
        };

        var settings = $.extend(defaults, options);


        if (typeof(L) === 'undefined') {
            throw new Error('Storymap requires Laeaflet');
        }
        if (typeof(_) === 'undefined') {
            throw new Error('Storymap requires underscore.js');
        }

        function getDistanceToTop(elem, top) {
            var docViewTop = $(window).scrollTop();

            var elemTop = $(elem).offset().top;

            var dist = elemTop - docViewTop;

            var d1 = top - dist;

            if (d1 < 0) {
                return $(document).height();
            }
            return d1;

        }

        function highlightTopPara(paragraphs, top) {

            var distances = _.map(paragraphs, function (element) {
                var dist = getDistanceToTop(element, top);
                return {el: $(element), distance: dist};
            });

            var closest = _.min(distances, function (dist) {
                return dist.distance;
            });

            _.each(paragraphs, function (element) {
                var paragraph = $(element);
                if (paragraph[0] !== closest.el[0]) {
                    paragraph.trigger('notviewing');
                }
            });

            if (!closest.el.hasClass('viewing')) {
                closest.el.trigger('viewing');
            }
        }

        function watchHighlight(element, searchfor, top) {
            var paragraphs = element.find(searchfor);
            highlightTopPara(paragraphs, top);
            $(window).scroll(function () {
                highlightTopPara(paragraphs, top);
            });
        }

        var makeStoryMap = function (element, markers, markerOptions) {

            var topElem = $('<div class="breakpoint-current"></div>')
                .css('top', settings.breakpointPos);
            $('body').append(topElem);

            var top = topElem.offset().top - $(window).scrollTop();

            var searchfor = settings.selector;

            var paragraphs = element.find(searchfor);

            paragraphs.on('viewing', function () {
                $(this).addClass('viewing');
            });

            paragraphs.on('notviewing', function () {
                $(this).removeClass('viewing');
            });

            watchHighlight(element, searchfor, top);

            var map = settings.createMap();

            var initPoint = map.getCenter();
            var initZoom = map.getZoom();

            var fg = L.featureGroup().addTo(map);

            var clusteredMarkers = L.markerClusterGroup({
              showCoverageOnHover: false,
              maxClusterRadius: 50
            });

            function showMapView(key) {

                fg.clearLayers();

                clusteredMarkers.clearLayers();

                if (key === 'overview') {
                    map.setView(initPoint, initZoom, true);
                } else if (markers[key]) {
                    var marker = markers[key];
                    var center = marker.center;
                    var photos = marker.photos;
                    var layer = marker.layer;
                    if(typeof layer !== 'undefined'){
                      fg.addLayer(layer);
                    };
                    // change to circleMarker so marker is more easily customized
                    //fg.addLayer(L.circleMarker([center.lat, center.lon], markerOptions));

                    // add photos
                    for (var i = 0; i < photos.length; i++) {
                      
                      if (settings.clustering == true) {

                        clusteredMarkers.addLayer(L.circleMarker([photos[i].lat, photos[i].lon], markerOptions)
                          .bindTooltip("<img class='tooltip-image' src='"+photos[i].url+"'>"));

                        fg.addLayer(clusteredMarkers);

                      } else {

                        fg.addLayer(L.circleMarker([photos[i].lat, photos[i].lon], markerOptions)
                          .bindTooltip("<img class='tooltip-image' src='"+photos[i].url+"'>"));

                      }

                    }

                    map.setView([center.lat, center.lon], center.zoom, 1);
                }

            }

            paragraphs.on('viewing', function () {
                showMapView($(this).data('place'));
            });
        };

        makeStoryMap(this, settings.markers, settings.markerOptions);

        return this;
    }

}(jQuery));
