var app = angular.module('app', [])

.factory('mapFactory', function() {
  var factory = {};
  factory.create = function(elt) {
    return new google.maps.Map( document.getElementById(elt), {
           center: new google.maps.LatLng(37.73488314788311, -122.4730110168457),
           mapTypeId: google.maps.MapTypeId.ROADMAP,
           zoom: 13
    });
  };
  return factory;
})

.factory('polyFactory', function() {
  var factory = {},
      config = {
          strokeOpacity: 0.7,
          strokeWeight: 1,
          fillOpacity: 0.3
      },

      getBounds = function(rawBounds) {
          var path = [];
          rawBounds.forEach(function(b) {
              path.push(new google.maps.LatLng(b.lat, b.lng))
          });
          return path;
      };

  factory.create = function(map, path, color, highlighted) {
      color = color || '#000';
      config.paths = getBounds(path);
      config.strokeColor = color;
      config.fillColor = color;

      var poly = new google.maps.Polygon(config);
      if (highlighted) { 
          poly.setOptions({zIndex: 20000}); 
          poly.setVisible(false);
          poly.highlighted = true;
      }

      poly.setMap(map);
      return poly;
  }

  return factory;
})

.factory('markerFactory', function() {
    var factory = {},
        colorMap = {
            blue: 0, red: 23, green: 46,
            purple: 69, orange: 92,
        },
        
        icon = {
            url: 'resources/house-sprite2.png',
            size: new google.maps.Size(23, 22),
            anchor: new google.maps.Point(12.5, 22)
        },
        highlightIcon = {
            url: 'resources/house-sprite2.png',
            size: new google.maps.Size(23, 22),
            anchor: new google.maps.Point(12.5, 22),
            zIndex: 1000000
        },

        getIcon = function(color, highlighted) {
            return {
                url: 'resources/house-sprite2.png',
                origin: new google.maps.Point(colorMap[color], highlighted ? 23 : 0),
                size: new google.maps.Size(23, 22),
                anchor: new google.maps.Point(12.5, 22)
            };
        },
        getHighlightIcon = function(color) {
            return getIcon(color, true);
        };

    factory.create = function(map, loc, color, highlighted) {
        var icon = highlighted ? getHighlightIcon(color) : getIcon(color),
            position = new google.maps.LatLng(loc.lat, loc.lng);

        return new google.maps.Marker( { 
              position: position,
                   map: map,
                  icon: icon 
        });
    };

    return factory;
})

.factory('developerFactory', ['markerFactory', 'polyFactory', function(markerFactory, polyFactory) {
   var factory = {},
       developers = [],
       originalData;

    factory.parseDevelopers = function(map, data) {
        var developer, site;
        for (var i in data) {
            developer = data[i];

            for (var j in developer.sites) {
                site = developer.sites[j];
                site.visible = true;

                if (site.location.marker) {
                  site.marker = markerFactory.create(map, site.location.marker, developer.color);
                  site.highlightMarker = markerFactory.create(
                      map, site.location.marker, developer.color, true);
                  site.highlightMarker.setVisible(false);
                }
                if (site.location.bounds) {
                  site.polygon = polyFactory.create(map, site.location.bounds, developer.color);
                  site.highlightPolygon = polyFactory.create(
                      map, site.location.bounds, developer.highlightColor, true);
                  site.highlightPolygon.setVisible(false);
                }
            }
        }
        return data;
    };

    return factory;
}])

.controller('developerController', function($scope) {
    $scope.expanded = false;
    $scope.visible = true;

    $scope.toggleClass = function() { $scope.expanded = !$scope.expanded; };

    $scope.toggleSite = function(site, visible) {
      if (visible === undefined) { visible = !site.visible; }
      site.visible = visible;

      if (site.marker)
        site.marker.setVisible(visible);
      if (site.polygon)
        site.polygon.setVisible(visible);
    };

    $scope.toggleSites = function(sites) {
        $scope.visible = !$scope.visible;
        for (var i in sites) {
          $scope.toggleSite(sites[i], $scope.visible);
        }
    };
    
    $scope.highlightMarker = function(site, marker, polygon) {
        if (site.visible) {
          if (marker) {
            marker.setVisible(true); 
            marker.setZIndex(3000);
          }
          if (polygon) {
            polygon.setVisible(true);
          }
        }
    };
    $scope.lowlightMarker = function(marker, polygon) {
        if (marker)  { marker.setVisible(false); }
        if (polygon) { polygon.setVisible(false); }
    };

})

.controller('developerListController',  ['$scope', 'developerFactory', 'mapFactory', 
    function($scope, developerFactory, mapFactory) {
        $scope.map = mapFactory.create('map');
        $scope.developers = developerFactory.parseDevelopers($scope.map, data);
    }
]);

app.directive("expander", function() {
    return function(scope, elt, attrs) {
        elt.bind("click", function() {
            scope.$apply(attrs.expander);
        });
    }
});
app.directive("hover", function() {
    return function(scope, elt, attrs) {
        elt.bind("mouseenter", function() {
            scope.$apply(attrs.hover);
        });
        elt.bind("mouseout", function() {
            scope.$apply(attrs.leave);
        });
    }
});
