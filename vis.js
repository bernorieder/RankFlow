function startVis(_valname,_w,_h) {

	// variables to modify
	c_width = parseInt(_w);
	c_height = parseInt(_h);

	_barwidth = 12;
	_lineopacity = 0.35;
	_linedist = 0;
	_heightfactor = 2;
	_heightpadding = 5;
	_minblockheight = 3;
	
	_constrokecol = "#fff";
	_constrokewidth = "1px";
	_blostrokecolor = "#000";
	_blostrokewidth = "1px";
	
	// do not modify
	_topalign = false;
	_colorMetric = _valname;
	_mainVar = _valname; 	
	_slicecount = 0;
	_bottomspacing = 5;
	_topspacing = 15;
	_rightspacing = 40;
	_barheights = new Object;
	_dataarray = new Object;
	_dataSortSize = new Object;
	_highest = 0;
	_lowest = 100000000000000000000000000;
	_highestel = 0;
	_lowestel = 100000000000000000000000000;
	_labels = false;

	$("#visualization").html("");
	$("#visualization").css("width",(c_width + 30) + "px");
	$("#visualization").css("visibility", "visible");
	$("#vis_interface").css("visibility", "visible");
	$("#vis_svg").css("visibility", "visible");

	_slicecounter = 0;
	for(var _slice in _data) {
		_slicecounter++;
		_rowcounter = 0;
		for(var _word in _data[_slice]) { _rowcounter++; }
	}


	createInterface(_valname);

	_pf = 0;	// pixelfactor
	_cf = 0;	// colorfactor
	
	calculateFactors(_valname);

	_barspacing = Math.round((c_width - (_slicecount * _barwidth)) / (_slicecount - 1)) - _rightspacing;              	
	
	_slices = new Object;	
	_lines = new Object;
	_linescon = new Object;
	_connectors = new Object;
	_labels = new Object;
	
	_sortdata = _data;
	
	r = null;
	
	createCanvas();
	drawvis(_sortdata);
	colorcode(_colorMetric);
}


function createInterface(_valname) {
	
	// finding the highest bar and ordering the words in each slice by their value
	for(var _slice in _data) {
	    _slicecount++;
	    _barheights[_slice] = 0;
	   	_dataarray[_slice] = new Array;
	    for(var _word in _data[_slice]) {
	        _barheights[_slice] += _data[_slice][_word][_valname];
	        var _tmphash = new Array(_word, _data[_slice][_word]);
	        //console.log(_tmphash);
	        _dataarray[_slice].push(_tmphash);
	        _highestel = (_data[_slice][_word][_valname] > _highestel ) ? _data[_slice][_word][_valname]:_highestel;
	    	_lowestel = (_data[_slice][_word][_valname] < _lowestel) ? _data[_slice][_word][_valname]:_lowestel;
	    }
	    
	    _highest = (_barheights[_slice] > _highest ) ? _barheights[_slice]:_highest;
	    _lowest = (_barheights[_slice] < _lowest) ? _barheights[_slice]:_lowest;
	    
		_dataarray[_slice].sort(function(a,b) {
			return b[1][_valname] - a[1][_valname];
		});
		
		_dataSortSize[_slice] = new Object;				// clear old object and write new
	    for(var _key in _dataarray[_slice]) {
	    	
	    	_dataSortSize[_slice][_dataarray[_slice][_key][0]] = new Object;
	    	
	    	for(var _metric in _dataarray[_slice][_key][1]) {
	    		_dataSortSize[_slice][_dataarray[_slice][_key][0]][_metric] = _dataarray[_slice][_key][1][_metric];
	    	}
	    }
	}
	
	
	var _ihtml = 'Color coding: <select onchange=\'colorcode(this.options[this.selectedIndex].value);\' name=\'vis_colorcoding\'>';
	var _exit = false;
	
	dance:
	for (_slice in _data) {
		for (_term in _data[_slice]) {
			for(_metric in _data[_slice][_term]) {
				var _selected = (_metric == _colorMetric) ? "selected":"";
				_ihtml += '<option value="' + _metric + '" ' + _selected + '>' + _metric + '</option>';
				_exit = true;
			}
			if(_exit == true) { break dance;}
		}
	}

	_ihtml += '</select>'+
			  '<input type="checkbox" onchange="changeInterface(\'labels\',this.checked);" id="vis_labels"/> show labels ';
			  
	if(!_singlerow) {
		_ihtml += '<input type="checkbox" onchange="changeInterface(\'sorting\',this.checked);"  id="vis_sorting"/> sort by value'+
			  	  '<input type="checkbox" onchange="changeInterface(\'valign\',this.checked);"  id="vis_valign"/> align on top'; }

	$("#vis_interface").html(_ihtml);
}


function calculateFactors(_valname) {

	// calculating the pixelfactor, colorfactor and normalizing data
	_pf = (c_height - _bottomspacing - _topspacing - (_heightpadding * _rowcounter)) / _highest;
	_cf = (_highestel * _pf) / 200;
	for(var _slice in _data) {
		_barheights[_slice] = 0;
		for(var _word in _data[_slice]) {
			_data[_slice][_word]["height"] = Math.round(_data[_slice][_word][_valname] * _pf);
			if(_data[_slice][_word]["height"] < _minblockheight) { _data[_slice][_word]["height"] = _minblockheight; }
			_dataSortSize[_slice][_word]["height"] = Math.round(_dataSortSize[_slice][_word][_valname] * _pf);
			if(_dataSortSize[_slice][_word]["height"] < _minblockheight) { _dataSortSize[_slice][_word]["height"] = _minblockheight;}
			_barheights[_slice] += _data[_slice][_word]["height"] + _heightpadding;
			if((_barheights[_slice] + _bottomspacing + _topspacing) > c_height) { c_height = _barheights[_slice] + _bottomspacing + _topspacing; }
		}
	}
	console.log(c_height);
}


function createCanvas() {
 
	_leftspacing = (_highest.toString().length * 8) + 5;
                         	
	r = Raphael(document.getElementById("visualization"), c_width + 30, c_height);
	r.path("M" + a(_leftspacing - 5) + " " + a(c_height) + "L" + a(_leftspacing - 5) + " " + a(0)).attr({stroke: "#000"});
	
	r.canvas.onclick = function() {
		for(var _line in _lines) {
			for(var i = 0; i < _lines[_line].length; i++) {
				_lines[_line][i].color(_lines[_line][i].concol);
				//console.log(_lines[_line][i].concol);
				if(_lines[_line][i].label) {
					_lines[_line][i].labelon = false;
					_lines[_line][i].label.remove();
				}
			}
		}
	}
	
	var _bottomLabel = r.text(_leftspacing-10,(c_height - 9),"0").attr("text-anchor","end");
	var _topLabel = r.text(_leftspacing-10,20,_highest).attr("text-anchor","end");
}


function drawvis(_data) {
	
	var i = 0;
	var _wordlisthtml = "";
	
	_lines = new Object;
	
	for(var _slice in _data) {
        
		if(typeof(_slices[_slice]) == "undefined") {
			_slices[_slice] = new Object;
		}
	                          		
	    var j = 0;
	    var _pos = 0;
	    
	    if(typeof(_labels[_slice]) == "undefined") {
			_labels[_slice] = r.text(_leftspacing + _barspacing * i,5,_slice).attr("text-anchor","start");
		}	
	    
	    /*
	    var _tmpkeys = Object.keys(_data[_slice]);
	    if(_top == true) {
		   console.log(_tmpkeys);
		   //_tmpkeys.reverse();
		   console.log(_tmpkeys);
	    }
	    */
	    
	    for(var _block in _data[_slice]) {
	    		    	
	    	if(_topalign == true) {
	    		var tmp_y = _pos + _topspacing + (_heightpadding * j);
	    	} else {
		    	var tmp_y = c_height - _bottomspacing - _barheights[_slice] + (_heightpadding * j) + _pos;
	    	}
	    	
	    	if(typeof(_slices[_slice][_block]) == "undefined") {
				_slices[_slice][_block] = new block(_slice,_leftspacing + _barspacing * i,tmp_y,_data[_slice][_block],_block);
				_slices[_slice][_block].draw();
	    	} else {
	    		_slices[_slice][_block].move(tmp_y);
	    	}
            
           	
			_pos += _data[_slice][_block]["height"];
	        j++;
	                                    			
	        if(typeof(_lines[_block]) == "undefined") {
	            _lines[_block] = new Array();
	        }
	                                    			
	        _lines[_block].push(_slices[_slice][_block]);
	    }
                                    		
    	i++;
	}
	
	$("#wordlist").html(_wordlisthtml);
	
	//console.log(_lines);
	
	for(var _word in _lines) {
		
		if(typeof(_linescon[_word]) == "undefined") {
			_linescon[_word] = new Array;
		}
		
	    for(var i = 1; i < _lines[_word].length; i++) {
	    	if(typeof(_linescon[_word][i - 1]) == "undefined") {
				_linescon[_word][i - 1] = new connector(_lines[_word][i],_lines[_word][i-1]);
				_linescon[_word][i - 1].draw();
			} else {
				_linescon[_word][i - 1].move();
			}
	    }
	}
}


function colorcode(_sel) {
	
	_colorMetric = _sel;
	
	console.log(_sel);
	
	var _tmphighest = 0;
	var _tmplowest = 10000000000000000;
	
	for(var _slice in _data) {
		for(var _word in _data[_slice]) {
			var _tmphighest = (parseInt(_data[_slice][_word][_colorMetric]) > _tmphighest) ? _data[_slice][_word][_colorMetric]:_tmphighest;
			var _tmplowest = (parseInt(_data[_slice][_word][_colorMetric]) < _tmplowest) ? _data[_slice][_word][_colorMetric]:_tmplowest;
		}
	}
    
    //console.log(_tmplowest + " / " + _tmphighest);
        	
    var _cf = _tmphighest / 100;
	
	for(var _line in _lines) {
        for(var i = 0; i < _lines[_line].length; i++) {
        	
        	var _tmpcol = "rgb(" + (Math.round(_lines[_line][i].values[_colorMetric] / _cf * 2)) + "," + (Math.round(200 - (_lines[_line][i].values[_colorMetric] / _cf * 2))) + "," + (Math.round(255 - (_lines[_line][i].values[_colorMetric] / _cf * 2))) + ")";
        	
        	//console.log(_lines[_line][i].values[_colorMetric] + " " + _tmpcol);
        	_lines[_line][i].concol = _tmpcol;
    		_lines[_line][i].color(_tmpcol);
		}
    }

    for(var _word in _linescon) {
    	for(var _con in _linescon[_word]) {
    		_linescon[_word][_con].color();
		}
	}
}


function block(_slice,_x,_y,_values,_label) {
                                    		
    var _this = this;

	this.slice = _slice;
	this.labelID = _label;
    this.labelText = (_limitlabel) ? _label.substr(0,25) + " (" + _values["uservariable"] + ")":_label + " (" + _values["uservariable"] + ")";
    this.values = _values;
    this.x = _x;
    this.y = _y;
    this.width = _barwidth;
    this.height = _values["height"];
	this.concol = "#000";
	this.labelon = false;
    
   // console.log("concol:" + this.concol + " " + this.height);

    this.draw = function() {

        this.rect = r.rect(a(this.x), a(this.y), this.width, this.height).attr({
            "fill":this.concol,"stroke":_blostrokecolor,"stroke-width":_blostrokewidth
		});
                                    						        
        _this.rect.node.onclick = function() {
			_tmp =  _this.labelID.replace(/\"/g,"\\\"");
	        window.setTimeout('_lines["' + _tmp + '"][0].highlight()',50);
        }
    }
    
	this.move = function(_to) {
		this.y = _to;
		if(this.labelon == true) {this.label.remove();}
		this.rect.animate({y:a(_to)},_anispeed, "<",function() {
			if(_this.labelon == true) {_this.showLabel()}; 	
		});
	}
                                            
    this.highlight = function() {                              	
        for(var i = 0; i < _lines[this.labelID].length; i++) {
            _lines[this.labelID][i].color("#000");
           _lines[this.labelID][i].labelon = true;
		   _lines[this.labelID][i].label = r.text(a(_lines[this.labelID][i].x) + _barwidth + _linedist, a(_lines[this.labelID][i].y + (_lines[this.labelID][i].height / 2)), _lines[this.labelID][i].labelText).attr("text-anchor","start");

        }
		//this.labelon = true;
		//this.label = r.text(a(this.x) + _barwidth + _linedist, a(this.y + (this.height / 2)), this.labelText).attr("text-anchor","start");
    }
                                            
    this.color = function(_col) {
    	
        _this.rect.attr({
            fill:_col
        });
    }
                                            
    this.showLabel = function() {
    	this.labelon = true;
        this.label = r.text(a(this.x) + _barwidth + _linedist + 2, a(this.y + (this.height / 2)), this.labelText).attr("text-anchor","start");
    }
                                            
    this.hideLabel = function() {
		if(this.label) {
			this.labelon = false;
			this.label.remove();
		}
    }
}


function connector(_obj1,_obj2) {
	
	var _this = this;
	
	this.obj1 = _obj1;
	this.obj2 = _obj2;

	this.draw = function() {
   
   		this.calcpoly();
	
   		this.line = r.path(this.poly).attr({
			"stroke":_constrokecol,"stroke-width":_constrokewidth
		});
		
		this.line.toBack();
	}
	
	this.color = function() {
		
		_this.line.attr({
	        fill: "0-" + _this.obj2.concol + "-" + _this.obj1.concol
	    });
	    
		_this.line.node.style.opacity = _lineopacity;
	}
	
	this.calcpoly = function() {
		
		//console.log(this.obj1.x + " " + this.obj2.x);
                                        
	    if(this.obj1.x < this.obj2.x) {
	        var from_x = a(this.obj1.x + this.obj1.width);
	        var to_x = a(this.obj2.x);
	    } else {
	        var from_x = a(this.obj1.x - _linedist);
	        var to_x = a(this.obj2.x + this.obj2.width + _linedist);
	    }
	                                        	
	    var from_y = this.obj1.y + (this.obj1.height / 2);
	    var to_y = this.obj2.y + (this.obj2.height / 2);
	
		
		//console.log("f:" + from_x + "|t:" + to_x + "|f-t:" + ((from_x - to_x) / 2));
		_tmpdist = from_y - to_y;
		_widthfactor = _tmpdist / (_barspacing * 5);
				
		// var v_path1 = "M10 10L10 90L90 90L90 10L10 10";
		this.poly = "M" + from_x + " " + (from_y + (this.obj1.height / _heightfactor)) +
					"Q" + (to_x + ((from_x - to_x) / 4 * 3)) + " " + (from_y + (this.obj1.height / _heightfactor)) + " " + (to_x + ((from_x - to_x) / 2) - _widthfactor) + " " + (to_y + ((from_y - to_y) / 2) + (((this.obj1.height + this.obj2.height) / 2) / _heightfactor)) + " T" + to_x + " " + (to_y + (this.obj2.height / _heightfactor)) +
					//"L" + to_x + " " + (to_y + (this.obj2.height / _heightfactor)) +
					"L" + to_x + " " + (to_y - (this.obj2.height / _heightfactor)) +
					"Q" + (to_x + ((from_x - to_x) / 4)) + " " + (to_y - (this.obj2.height / _heightfactor)) + " " + (to_x + ((from_x - to_x) / 2) + _widthfactor) + " " + (to_y + ((from_y - to_y) / 2) - (((this.obj1.height + this.obj2.height) / 2) / _heightfactor)) + " T" + from_x + " " + (from_y - (this.obj1.height / _heightfactor)) +
					//"L" + from_x + " " + (from_y - (this.obj1.height / _heightfactor)) +
					"L"+ from_x + " " + (from_y + (this.obj1.height / _heightfactor));
	}
	
	this.move = function() {
		
		this.calcpoly();
		
		this.line.animate({path:this.poly},_anispeed,"<");	
	}
}


function a(_v) {
    return _v + 0.5;
}


function changeInterface(_what,_action) {
                                    		
    if(_what == 'labels') {
        for(var _line in _lines) {
            for(var i = 0; i < _lines[_line].length; i++) {
                if(_action == true) {
	                if( _lines[_line][i].labelon == false) { _lines[_line][i].showLabel(); }
                } else {
                    _lines[_line][i].hideLabel();
                }
            }
        }
    }
    
    if(_what == "sorting") {
	    _anispeed = 700;
    	if(_action == true) {
	    	_sortdata = _dataSortSize;
        } else {
			_sortdata = _data;
        }
        drawvis(_sortdata);
    }
    
    if(_what == "valign") {
	    _anispeed = 400;
    	if(_action == true) {
	    	_topalign = true;
        } else {
			_topalign = false;
        }
        drawvis(_sortdata);
    }
}


function encode_as_img_and_link() {
	 $("svg").attr({ version: '1.1' , xmlns:"http://www.w3.org/2000/svg"});
	 var svg = $("#visualization").html();
	 svg = svg.replace(/fill="url\('.+?#/g,"fill=\"url('#");
	 var file = new Blob([svg], { type: 'image/svg+xml' });
	 var fileURL = URL.createObjectURL(file);
	 $("#svgdown").html($(`<a style="width:25px;height:25px;" href-lang="image/svg+xml" download="rankflow.svg" href="${fileURL}" title="file.svg" target="_blank">download</a>`));
}
