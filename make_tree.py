#Scripted GeoExt tree config for ER web site
#Jason on January 10,2013
#Sample json format
#[
#{"event": "Hx Sandy", "key":"poly", "flight": "October 31, 2012 Flt1", "name":"oct31polyA", "url": "kml/20121031a_poly.kml", "options": {"group": "sandy_20121031_flt1"}, "download": "http://storms.ngs.noaa.gov/storms/sandy/download/oct31aJpegTiles_GCS_NAD83.zip"},
#{"event": "Hx Sandy", "key":"tiles", "flight": "October 31, 2012 Flt1", "name":"oct31tilesA", "url": "kml/20121031a.kml", "options": {"group": "sandy_20121031_flt1"}, "download": "http://storms.ngs.noaa.gov/storms/sandy/download/oct31aJpegTiles_GCS_NAD83.zip"},
#{"event": "Hx Sandy", "key":"xyz", "flight": "October 31, 2012 Flt1", "name":"oct31tmsA", "url": "http://storms.ngs.noaa.gov/storms/sandy/imagery/3052012flt1/tilefilter.php?z=${z}&x=${x}&y=${y}.png", "options": {"group": "sandy_20121031_flt1"}, "download": "http://storms.ngs.noaa.gov/storms/sandy/download/oct31aJpegTiles_GCS_NAD83.zip"}
#]

import json

def makeTreeConfig(tree_config):

    tree = open(tree_config,'w')

    try:

        output_json = json.load(open('sandy_data.json'))
    
    except ValueError:

        print 'Error! This json is invalid!'

    eventName = str(output_json[0]['event'])
    eventText = JShead()%(eventName)
    tree.write(eventText)

    layers =[]

    count =0
    for items in output_json:

        layerName = output_json[count]['name']
        layers.append(layerName)

        if output_json[count]['key'] == 'xyz'and count == 2: #count is 2 because the first day of xyz
                                                             #tiles are the 3rd element in the json list. 
                                                             #this will expand the first day folder   
            flight = output_json[count]['flight']
            group = output_json[count]['options']['group']
            name = output_json[count]['name']
            download = output_json[count]['download']
            treeTextExpand = JSbodyExpand()%(flight,group,group,name,download)
            tree.write(treeTextExpand)

        elif output_json[count]['key'] == 'xyz' and count > 2: #all other flight days will have collapsed folders

            flight = output_json[count]['flight']
            group = output_json[count]['options']['group']
            name = output_json[count]['name']
            download = output_json[count]['download']
        
            treeTextCollapse = JSbodyCollapse()%(flight,group,group,name,download)
            tree.write(treeTextCollapse)

        
        count=count+1

    tree.write(JStail())
    tree.close()

    print 'Layers added to the map:\n'
    for layer in layers:
        print layer
    print '\nGeoExt tree config is finished.'


def JShead():
    head='''[{
"text": "<b>%s Data Layers</b>",'''
    return head

def JSbodyExpand():
    bodyExpand='''
"children": [
    {     
     "nodeType": 'gx_layercontainer',
     "text": '%s',
     "group": '%s',
     "expanded": true,
     "children": [
     ],
     "loader": {
            "filter": function(rec) {
                return (rec.get("layer").options.group == '%s');
	     },
	
	    "baseAttrs": {
                "uiProvider": "custom_ui"
             },

	    "createNode": function(attr) {
	    
		if (attr.layer.name == "Response Imagery"){
		    attr.icon = '../scripts/images/camera.png'
					 
		    attr.component = {
                        xtype: 'gx_opacityslider',
                        layer: %s,
                        minValue: 0,
                        maxValue: 100,
                        aggressive: true,
                        inverse: true,
                        width: 100,
                        cls: 'opacityslidejson',
                        plugins: new GeoExt.LayerOpacitySliderTip({template: '<div>Transparency: {opacity}%%</div>'})
		    }
		}
			
		if (attr.layer.name == "Processed Tiles"){
		    attr.icon = '../scripts/images/tiles.png'			
		}
				
		if (attr.layer.name == "Download Zip"){
		    attr.icon = '../scripts/images/download.png'
		    attr.href = '%s'

		}
								
	        return GeoExt.tree.LayerLoader.prototype.createNode.call(this, attr)
	    }
	},
			
	"checked": true			
    }'''
    return bodyExpand

def JSbodyCollapse():
    bodyCollapse='''
,{     
     "nodeType": 'gx_layercontainer',
     "text": '%s',
     "group": '%s',
     "expanded": false,
     "children": [
     ],
     "loader": {
            "filter": function(rec) {
                return (rec.get("layer").options.group == '%s');
	     },
	
	    "baseAttrs": {
                "uiProvider": "custom_ui"
             },

	    "createNode": function(attr) {
	    
		if (attr.layer.name == "Response Imagery"){
		    attr.icon = '../scripts/images/camera.png'
					 
		    attr.component = {
                        xtype: 'gx_opacityslider',
                        layer: %s,
                        minValue: 0,
                        maxValue: 100,
                        aggressive: true,
                        inverse: true,
                        width: 100,
                        cls: 'opacityslidejson',
                        plugins: new GeoExt.LayerOpacitySliderTip({template: '<div>Transparency: {opacity}%%</div>'})
		    }
		}
			
		if (attr.layer.name == "Processed Tiles"){
		    attr.icon = '../scripts/images/tiles.png'			
		}
				
		if (attr.layer.name == "Download Zip"){
		    attr.icon = '../scripts/images/download.png'
		    attr.href = '%s'

		}
								
	        return GeoExt.tree.LayerLoader.prototype.createNode.call(this, attr)
	    }
	},
			
	"checked": true			
    }'''
    return bodyCollapse


def JStail():
    tail='''
],
    "expanded": true
}]

    '''
    return tail

makeTreeConfig(tree_config = 'tree_config.php')
