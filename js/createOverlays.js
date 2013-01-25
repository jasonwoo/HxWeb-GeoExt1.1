//Needed for IE8
if ( !Array.prototype.forEach ) {
  Array.prototype.forEach = function(fn, scope) {
    for(var i = 0, len = this.length; i < len; ++i) {
      fn.call(scope, this[i], i, this);
    }
  }
}

function createOverlays(mapObject){

	var mapLayer;
	
	var JsonFormat = new OpenLayers.Format.JSON(); 
	
	var styleMap = 	new OpenLayers.StyleMap({
		        "default": new OpenLayers.Style({
		            strokeColor: "#042E89",//ff0000
		            strokeOpacity: .7,
		            strokeWidth: 1,
		            fillColor: "#ff0000",
		            fillOpacity: 0,
		            cursor: "pointer"		            
		        }),
		        "temporary": new OpenLayers.Style({
		            strokeColor: "#ff0000",
		            strokeOpacity: .9,
		            strokeWidth: 2,
		            fillColor: "#ff0000",//ffff33
		            fillOpacity: 0,
		            cursor: "pointer",
					title: '${name}'					
		        })
	});
	
	OpenLayers.Request.GET({
        url: 'sandy_data.json',
        async: false,
        success: function(e) {
			 mapLayer = JsonFormat.read(e.responseText);
        }
    });

	mapLayer.forEach(function(l) {
		 
		 if (l.key == "xyz"){
         	window[l.name] = new OpenLayers.Layer.XYZ("Response Imagery",
         	l.url, {isBaseLayer: false,
         	options: l.options,
		 	visibility: true}
         	);
         mapObject.addLayer(window[l.name]);
        }

		if (l.key == "tiles"){
			//console.log(l.name);
			window[l.name] = new OpenLayers.Layer.Vector("Processed Tiles",{
			options: l.options,
	     	projection: new OpenLayers.Projection("EPSG:4326"),
	     	visibility: false,
	     	strategies: [new OpenLayers.Strategy.Fixed()],
	        protocol: new OpenLayers.Protocol.HTTP({
	     		  url: l.url,
	     		  format: new OpenLayers.Format.KML({
	     		       extractStyles: true,
	     		       extractAttributes: true
	              })
	         }),
			styleMap: styleMap
	        });
	        mapObject.addLayer(window[l.name]);	
		}
		
		if (l.key == "poly"){
			
			window[l.name] = new OpenLayers.Layer.Vector("Download Zip",{
			options: l.options,
	     	projection: new OpenLayers.Projection("EPSG:4326"),
	     	visibility: false,
	     	strategies: [new OpenLayers.Strategy.Fixed()],
	        protocol: new OpenLayers.Protocol.HTTP({
	     		  url: l.url,
	     		  format: new OpenLayers.Format.KML({
	     		       extractStyles: false,
	     		       extractAttributes: true
	              })
	         }),
			styleMap: styleMap
	        });
	        mapObject.addLayer(window[l.name]);
			
		}
   });
}
