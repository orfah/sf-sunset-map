var SFSD = {};

SFSD.Utils = {}
SFSD.Utils.bounds = function(rawBounds) {
	var path = [];
	rawBounds.forEach(function(b) {
		path.push(new google.maps.LatLng(b.lat, b.lng))
	});
	return path;
};
SFSD.Utils.makePoly = function(paths, color, highlighted) {
    var options = {
    				paths: SFSD.Utils.bounds(paths),
    				strokeColor: color,
    				strokeOpacity: 0.7,
    				strokeWeight: 1,
    				fillColor: color,
    				fillOpacity: 0.5
    },
    poly;
    
    if (highlighted) { options['zIndex'] = 20000; }
    poly = new google.maps.Polygon(options);
    if (highlighted) { poly.highlighted = true; poly.setVisible(false); }
    poly.setMap(SFSD.map);
    return poly;
};

// takes a hash containing lat and lng and a map icon
SFSD.Utils.makeMarker = function(loc, icon, highlighted) {
    var pos = new google.maps.LatLng(loc.lat, loc.lng),
        mapBounds = SFSD.map.getBounds(),
        marker = new google.maps.Marker({
    				position: pos,
    				map: SFSD.map,
    				icon: icon
    			});
    if (highlighted) { marker.highlighted = true; marker.setZIndex(10000); }
    return marker;
};

SFSD.HouseMarkers = {
  colors: ['blue', 'red', 'green', 'yellow', 'purple', 'orange'],
	setup: function() {
		if (!SFSD.HouseMarkers.markers) {
			SFSD.HouseMarkers.markers = [];
			// for convenience
			var i, l = SFSD.HouseMarkers.colors.length;
			for (i = 0; i < l; i++) {
				SFSD.HouseMarkers.markers[i] = {
					url: 'resources/house-sprite2.png',
					size: new google.maps.Size(23, 22),
					origin: new google.maps.Point(23 * i, 0),
					anchor: new google.maps.Point(12.5, 22)
				};

        // the highlighted marker
				SFSD.HouseMarkers.markers[i+l] = {
					url: 'resources/house-sprite2.png',
					size: new google.maps.Size(23, 22),
					origin: new google.maps.Point(23 * i, 23),
					anchor: new google.maps.Point(12.5, 22),
          zIndex: 1000000
				};
			}
		}
	}
};

SFSD.map = new google.maps.Map( document.getElementById("map"), {
	center: new google.maps.LatLng(37.73488314788311, - 122.4730110168457),
	mapTypeId: google.maps.MapTypeId.ROADMAP,
	zoom: 13
});

SFSD.AccordianFold = function(data, markerIndex) {
	this.data = data;
	this.markerIndex = markerIndex;
	this.render();
	return this;
};
SFSD.AccordianFold.prototype.render = function() {
	this.root = $('<div/>', {
		"class": "accordian-fold"
	});

	var sites = $('<ul/>', {
		"class": "hidden ul" + this.markerIndex
	}),
		  icon = SFSD.HouseMarkers.markers[this.markerIndex],
		  highlightedIcon = 
        SFSD.HouseMarkers.markers[this.markerIndex + SFSD.HouseMarkers.colors.length],
      color = this.data.color,
      highlightColor = this.data.highlightColor;

	this.root.append(
	$('<div/>', {
		"class": "label label" + this.markerIndex,
		html: '<input type="checkbox" checked> <span class="expander">&gt;&gt;</span> ' + this.data.developer + '</div>',
		data: {
			developer: this.data.developer,
			color: this.data.color
		}
	}));

	this.data.sites.forEach(function(site) {
		var overlayData = [],
        poly,
        info,
        marker;
		if (site.location.bounds) {
			poly = SFSD.Utils.makePoly(site.location.bounds, color);
			overlayData.push(poly);

			poly = SFSD.Utils.makePoly(site.location.bounds, highlightColor, true);
			overlayData.push(poly);
		} 
		if (site.location.marker) {
			info = new google.maps.InfoWindow({
				content: site.description
			});
			marker = SFSD.Utils.makeMarker(site.location.marker, icon);
			overlayData.push(marker);

      // highlighted marker
			marker = SFSD.Utils.makeMarker(site.location.marker, highlightedIcon, true);
      marker.setVisible(false);
			overlayData.push(marker);
		}

		sites.append(
        $('<li/>', {
            html: '<input type="checkbox" checked> ' + site.description,
            data: overlayData
		}));
	});

	this.root.append(sites);
	return this.root;
};

SFSD.AccordianFold.prototype.view = function() {
	if (!this.root) {
		this.render();
	}
	return this.root;
}
SFSD.AccordianFold.prototype.html = function() {
	this.view().html();
}

SFSD.AccordianSelect = function(data, elt) {
	elt = elt || $('#accordian').first();

	data.forEach(function(fold, colorIndex) {
		elt.append(new SFSD.AccordianFold(fold, colorIndex).view());
	});

	elt.on('click', this.handleEvent);
	elt.on('mousemove', this.handleEvent);
	elt.on('mouseleave', this.handleEvent);
};


SFSD.AccordianSelect.prototype.handleEvent = function(e) {
  if (e.type === 'click') { SFSD.AccordianSelect.prototype.handleClickEvent(e); }
  else if (e.type === 'mousemove' || e.type === 'mouseleave') { 
    SFSD.AccordianSelect.prototype.handleHoverEvent(e); 
  }
}

SFSD.AccordianSelect.prototype.handleHoverEvent = function(e) {
	var target = $(e.target),
      overlays,
      overlay, 
      index;

  if (target.prop('tagName') == 'LI') {
    overlays = target.data();
    for (index in overlays) {
      overlay = overlays[index];

      if (overlay.highlighted) {
        if (this.highlighted && overlay != this.highlighted) {
          this.highlighted.setVisible(false);
          if (this.normal) {
            this.normal.setVisible(true);
          }
        }
        overlay.setVisible(true);
        this.highlighted = overlay;
      }
      else {
          this.normal = overlay;
      }
    }
  }
  if (e.type === 'mouseleave') {
    if (this.normal) { this.normal.setVisible(true); }
    if (this.highlighted) { this.highlighted.setVisible(false); }
  }
};
SFSD.AccordianSelect.prototype.handleClickEvent = function(e) {
	var target = $(e.target),
      overlays,
      overlay,
      mapBounds = SFSD.map.getBounds(),
      index;

  if (target.prop('tagName') == 'LI') {
    // redirect to act as if user had clicked on a form label
    target = target.children().first();
    target.prop('checked', !target.prop('checked'));
  }
  else if (target.hasClass('label')) {
    // redirect to act as if user had clicked on expander
    target = target.find('.expander').first();
  }

	if (target.hasClass('expander')) {
    target.toggleClass('expanded');
		target.closest('.accordian-fold')
			.children('ul')
			.toggleClass('hidden');
	} 
  else if (target.prop('tagName') == 'INPUT') {
		if (target.parent().hasClass('label')) {
			target.parent().parent().find('li')
				.each( function(li) {
                  // recast as jquery object
				          li = $(this);
				          if (li.data) {
				          	overlays = li.data();
				          	for (index in overlays) {
                      overlay = overlays[index];
                      if (!overlay.highlighted) {
                        overlay.setVisible(target.prop('checked'))
                      }
				          	};
				          	li.find('input')
				          		.prop('checked', target.prop('checked'));
				          }
			});
		} 
    else {
			overlays = target.parent().data();
			for (index in overlays) {
				overlay = overlays[index];
				overlay.setVisible(target.prop('checked'));
        // duck type check to decide if the overlay is a polygon or a marker
				if (overlay.getPath) {
					pos = overlay.getPath()
						.getAt(0);
				} 
        else {
					pos = overlay.getPosition();
				}

				if (!mapBounds.contains(pos)) {
					SFSD.map.setCenter(pos);
				}
			}
		}
	}
};

SFSD.setup = function() {
  SFSD.HouseMarkers.setup();
  var af = new SFSD.AccordianSelect(data);
  google.maps.event.addListener(SFSD.map, 'click', function(e) {
  	console.log('{"lat":' + e.latLng.jb + ', "lng":' + e.latLng.kb + '},');
  });
}();
