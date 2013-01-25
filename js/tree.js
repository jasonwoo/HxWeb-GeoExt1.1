/**
 * Copyright (c) 2008-2010 The Open Source Geospatial Foundation
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
**/
//For new project update center point, how-to, metadata link
var map,
    tree,
    geographic = new OpenLayers.Projection("EPSG:4326"),
    googmerc = new OpenLayers.Projection("EPSG:900913");

Ext.onReady(function() {
    
    Ext.QuickTips.init();
	var loadingMask = Ext.get('loading-mask');
	var loading = Ext.get('loading');

	//Hide loading message           
	loading.fadeOut({ duration: 2.0, remove: true });
           
    //Hide loading mask
    loadingMask.setOpacity(0.9);
    loadingMask.shift({
		 xy: loading.getXY(),
         width: loading.getWidth(),
         height: loading.getHeight(),
         remove: true,
         duration: 1,
         opacity: 0.1,
         easing: 'bounceOut'
    });

    var config,
        treeConfig,
		geocoder, 
		locationLayer,
        flag = false,
		SHADOW_Z_INDEX = 10,
		MARKER_Z_INDEX = 11,
        //logo = '<a href="http://www.noaa.gov" target="_blank"><img src="NOAA_logo.jpg" alt="NOAA" width="100" height="100" /></a>',
        center = new OpenLayers.LonLat(-74.358, 39.430).transform(geographic,googmerc),
        G_mapH = new OpenLayers.Layer.Google("Google Hybrid",{type: google.maps.MapTypeId.HYBRID}),
        G_map  = new OpenLayers.Layer.Google("Google Streets");
 
    function childrenList(arr) {
        var list = [];
        function getLeaf(item) {
            if (item.children.length !== 0) item.children.forEach(getLeaf)
            else if (!item.group) list.push(item);
        }
        arr.forEach(getLeaf);
        return list;
    }

    function makeGroupCheckboxes(obj) {
        if (obj.group) obj.checked = false;
        obj.children.forEach(function(item) {
            if ((item.children.length !== 0) && (item.group)) {
                item.checked = false;
                item.children.forEach(makeGroupCheckboxes);
            }
        });
    }
	/*
	 Geocoder
	*/
	var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
	renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;

	geocoder = new google.maps.Geocoder();
    locationLayer = new OpenLayers.Layer.Vector("Location", {
	     styleMap: new OpenLayers.Style({
	          externalGraphic: "../scripts/images/marker.png",
			  backgroundGraphic: "../scripts/images/marker_shadow.png",
	          graphicYOffset: -27,
	          graphicHeight: 27,
	          graphicTitle: "${formatted_address}",
			  backgroundXOffset: 0,
			  backgroundYOffset: -7,
			  graphicZIndex: MARKER_Z_INDEX,
			  backgroundGraphicZIndex: SHADOW_Z_INDEX,
			  pointRadius: 10
	     }),
			  rendererOptions: {yOrdering: true},
			  renderers: renderer
	});
    
    /*
     Map
    */
	 // avoid pink tiles
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
    OpenLayers.Util.onImageLoadErrorColor = "transparent";
     
    OpenLayers.Util.onImageLoadError = function(){this.src="http://ngs.woc.noaa.gov/storms/scripts/images/clear.png";}
    OpenLayers.Tile.Image.useBlankTile=false;
    
    map = new OpenLayers.Map({
	    projection: googmerc,
        units: "m",
        numZoomLevels:19,
        maxResolution: 156543.0339,
		maxExtent: new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508.34),
		controls: [new OpenLayers.Control.Navigation(),new OpenLayers.Control.PanPanel(),new OpenLayers.Control.ZoomPanel()]
    });
    map.addLayers([locationLayer,G_map,G_mapH]);
    createOverlays(map);
    
    /*
    Adding NOAA logo to map
    */
    /*var container = map.viewPortDiv;
    var div = document.createElement("div");
    div.style.position = "absolute";
    div.style.zIndex = "1100";
    div.style.right = "1px";
    div.style.top = "1px";
    div.innerHTML = logo;
    container.appendChild(div);*/

	/*
	Remove all layers
	*/
	var tglbutton = new Ext.Button({
		tooltip: 'Remove All Layers',
		icon: '../scripts/images/layer_delete.png',
		enableToggle: false,
		handler:function(){
			tree.expandAll();
			tree.getRootNode().cascade(function(n) {
				var ui = n.getUI();
				ui.toggleCheck(false);
			});
			tree.collapseAll();    
		}
	});
	
	/*
	Contact
	*/
	
	var contactMessage;
	var contactInfo = function() {
        if (! contactMessage) {
            contactMessage = new Ext.Window({
                title    : "Contact Us",
                html          : "<br>&nbsp<b><a href='mailto:ngs.hurricane1@noaa.gov'>Content and Technical Issues </a></b><br><br>&nbsp<b><a href='mailto:ngs.hurricane2@noaa.gov'>Comments and Policy Issues </a><br></b>",
                closeAction   : "hide",
                height        : 100,
                width         : 200
            });
        }
        contactMessage.show();
	}
	
    /*
    -= Controls =-
    */

	var polyselect = new OpenLayers.Control.SelectFeature(map.getLayersByName('Download Zip'), 
	    {hover: true,
	    	highlightOnly: true,
		    renderIntent: "temporary"

	});
	
    var tileselect = new OpenLayers.Control.SelectFeature(map.getLayersByClass('OpenLayers.Layer.Vector'),//In order for the two controls to coexist all vector layers needed here
        {//hover: true,
			hover: false,
			toggle: true,
			clickout: true
		 	//highlightOnly: true,
		   // renderIntent: "temporary"
     });
	 
	polyselect.handlers.feature.stopUp = false; 
	polyselect.handlers.feature.stopDown = false;
	tileselect.handlers.feature.stopUp = false;
    tileselect.handlers.feature.stopDown = false;   

	map.addControl(polyselect);//order of the controls is important!
    polyselect.activate();

	map.addControl(tileselect);
    tileselect.activate();
	
    /*
	Feature Selected to show Popups
	*/
	map.getLayersByName('Processed Tiles').forEach(function(p) {				
		p.events.on({
		   	 featureselected: function(e) {
		   	   	  createPopup(e.feature);
		   	 }
		});	
	});

    /*
     Vector Popups
    */

    function createPopup(feature) {
	
		var content = feature.attributes.description;
        popup = new GeoExt.Popup({
            title: 'Tile Info',
            location: feature,
            anchored: true,
            width:250,
            height:175,
            html: content,
            maximizable: false,
            collapsible: true,
            resizable: false,
            autoScroll: true
        });

        popup.show();
    }

    var LayerNodeUI = Ext.extend(GeoExt.tree.LayerNodeUI, new GeoExt.tree.TreeNodeUIEventMixin());

    /*
    Load layer tree     
   */
    
    OpenLayers.Request.POST({
		url: 'tree_config.php',
        data: OpenLayers.Util.getParameterString({config_type: "primary"}),
        async: false,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        callback: function(response) {
            var layer,
                icon;
                config = Ext.decode(response.responseText)[0];
               // console.log(response.responseText); //debug

            //Make checkboxes for group nodes and set them to unchecked state
            makeGroupCheckboxes(config);

            treeConfig = [config,
                             {
                               expanded: false,
                               nodeType: "gx_baselayercontainer",
                               text: "<b>Base Layers</b>"
                             }
                         ];
        }
    });

    tree = new Ext.tree.TreePanel({
        border: true,
        region: "center",
        title: "Layers",
		cls: "overrideit",
        width: 350,
        autoScroll: true,
		plugins:  [{ptype: "gx_treenodecomponent"}],
        loader: new Ext.tree.TreeLoader({
            applyLoader: false,
            uiProviders: {
                //"layernodeui": LayerNodeUI,
				"custom_ui": LayerNodeUI	
            }
       }),

          listeners: {
    
            checkchange: function(node, checked){
                //Check all childs if parent is checked
                if ((node.attributes.group) && (!flag)){
                    checked ? node.expand() : node.collapse();
                    node.eachChild(function(child){
                        child.ui.toggleCheck(checked);
                    })
                }

                //Uncheck parent
                if ((!checked) && (node.parentNode.attributes.group)) {
                    var n = node.parentNode.firstChild;
                    flag = true;
                    while (n) {
                        if (n.ui.isChecked()) flag = false;
                        n = n.nextSibling;
                    }
                    if (flag) {
                        node.parentNode.ui.toggleCheck(checked);
                        flag = false;
                    }
                }

                //Check parent
                if ((checked) && (node.parentNode.attributes.group)) {
                    flag = true;
                    node.parentNode.ui.toggleCheck(checked);
                    flag = false;
                }
            }
        },
        root: {
			nodeType: "async",
            children: treeConfig
        },
        rootVisible: false,
        lines: true,
		bbar: [ { 
				   cls: "helpbbar",
	    	       text: "<b>Help</b>",
				   tooltip: "Help",
	    	       handler: function() {
	    	      		window.open("http://ngs.woc.noaa.gov/storms/sandy/docs/WebMapHowTo.1.3.pdf")
	    	       }
	    	     },
	    	     { 
				   xtype: 'tbseparator'
                 },
	    	     { 
		           cls: "helpbbar",
				   text: "<b>Metadata</b>",
				   tooltip: "Metadata",
				   handler: function() {
						window.open("http://ngs.woc.noaa.gov/storms/sandy/docs/sandy_metadata.htm")
	    	       }
			    },
				 {
		       	  xtype: 'tbseparator'
                   },
				{ cls: "helpbbar",
				text: "<b>Contact</b>",
				tooltip: "Contact",
				handler: contactInfo
	    	   }]
    });

    
    var westPanel = new Ext.Panel({
        id: "westPanel",
        border: false,
        layout: "border",
        region: "west",
        width: 200,
        split: true,
        collapseMode: "mini",
        items: [tree]
    });

    /*
     Viewport
    */
    vp = new Ext.Viewport({
	
         layout: "border",
         deferredRender: false,
         items: [
			{
	           region: "north",
	           contentEl: "title",
	           height: 67
	         },
	         {  
	           region: "south",
			   contentEl: "layout_footer",
			   height: 32
		     },
            {
                region: "center",
                id: "mappanel",
                title: "",
                xtype: "gx_mappanel",
                map: map,
                center: center,
                zoom: 8,
                split: true,
				items: [{
					xtype: "gx_zoomslider",
					vertical: true,
					height: 100,
					plugins: new GeoExt.ZoomSliderTip()
				}],
				tbar:[{
				   	xtype: "gx_geocodercombo",
					width: 250,
					layer: locationLayer,
					displayField: "formatted_address",
					emptyText: "Search Location",
					store: new Ext.data.JsonStore({
					     root: null,
						 fields: [
						 		"formatted_address",
						         {name: "lonlat", convert: function(v, rec) {
						                 var latLng = rec.geometry.location;
						                      return [latLng.lng(), latLng.lat()];
						         }},
						         {name: "bounds", convert: function(v, rec) {
						                 var ne = rec.geometry.viewport.getNorthEast(),
						                     sw = rec.geometry.viewport.getSouthWest();
						                 	  return [sw.lng(), sw.lat(), ne.lng(), ne.lat()];
						         }}
						 ],
					proxy: new (Ext.extend(Ext.data.DataProxy, {
						         doRequest: function(action, rs, params, reader, callback, scope, options) {
						                 geocoder.geocode({address: params.q}, function(results, status) {
						                      var readerResult = reader.readRecords(results);
						                      callback.call(scope, readerResult, options, !!readerResult);                        
						                 });
						         }
					}))({api: {read: true}})
					})
				   },
				   tglbutton
				]
            },
            westPanel]
    });

});
