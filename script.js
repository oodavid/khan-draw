(function() {
	// Tools, Shortcuts, Auto-Click #1
	$(document).ready(function(e){
		$('#tools').on('click', '.color', function(e){
			setColor($(this).css('background-color'));
		});
		$('#start').on('click', startRecording);
		$('#stop').on('click', stopRecording);
		$('#info').on('click', showInfo);
		$('#info-close').on('click', hideInfo);
		$(document).on('keydown', function(e){
			$('.color:contains("'+(e.which-48)+'")').click(); // 48-57 = 0-9
		});
		$('.color:contains("1")').click();
	});
	function setColor(color){
		tmp_ctx.strokeStyle = color;
		tmp_ctx.fillStyle   = color;
		$('#logo').css('background-color', color);
	}
	var startTime;
	var timerInterval;
	function startRecording(){
		$('#start').hide();
		$('#stop').show();
		startTime = Date.now();
		if(timerInterval){ clearInterval(timerInterval); }
		timerInterval = setInterval(renderTime, 50);
	}
	function stopRecording(){
		$('#stop').hide();
		$('#start').show();
		if(timerInterval){ clearInterval(timerInterval); }
	}
	function renderTime(){
		if(startTime){
			var s = Math.round((Date.now()-startTime)/1000);
			var h = Math.floor(s/3600); s -= (h*3600);
			var m = Math.floor(s/60);   s -= (m*60);
			h = ('00'+h).substr(-2);
			m = ('00'+m).substr(-2);
			s = ('00'+s).substr(-2);
			$('#time').text(h+':'+m+':'+s);
		}
		setVolumePct(100*Math.random());
	}
	function setVolumePct(pct){
		$('#volume').css('width', pct+'%');
	}
	function showInfo(){
		$('#info-popup').show();
	}
	function hideInfo(){
		$('#info-popup').hide();
	}
	

	// Smooth drawing from http://codetheory.in/html5-canvas-drawing-lines-with-smooth-edges/

	var canvas = document.querySelector('#canvas');
	var ctx = canvas.getContext('2d');
	
	var sketch = document.querySelector('#sketch');
	var sketch_style = getComputedStyle(sketch);
	canvas.width = parseInt(sketch_style.getPropertyValue('width'));
	canvas.height = parseInt(sketch_style.getPropertyValue('height'));
	
	
	// Creating a tmp canvas
	var tmp_canvas = document.createElement('canvas');
	var tmp_ctx = tmp_canvas.getContext('2d');
	tmp_canvas.id = 'tmp_canvas';
	tmp_canvas.width = canvas.width;
	tmp_canvas.height = canvas.height;
	
	sketch.appendChild(tmp_canvas);

	var mouse = {x: 0, y: 0};
	var last_mouse = {x: 0, y: 0};
	
	// Pencil Points
	var ppts = [];
	
	/* Mouse Capturing Work */
	tmp_canvas.addEventListener('mousemove', function(e) {
		mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
		mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
	}, false);
	
	/* Drawing on Paint App */
	tmp_ctx.lineWidth  = 3;
	tmp_ctx.lineJoin   = 'round';
	tmp_ctx.lineCap    = 'round';
	
	tmp_canvas.addEventListener('mousedown', function(e) {
		tmp_canvas.addEventListener('mousemove', onPaint, false);
		
		mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
		mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
		
		ppts.push({x: mouse.x, y: mouse.y});
		
		onPaint();
	}, false);
	
	tmp_canvas.addEventListener('mouseup', function() {
		tmp_canvas.removeEventListener('mousemove', onPaint, false);
		
		// Writing down to real canvas now
		ctx.drawImage(tmp_canvas, 0, 0);
		// Clearing tmp canvas
		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
		
		// Emptying up Pencil Points
		ppts = [];
	}, false);
	
	var onPaint = function() {
		
		// Saving all the points in an array
		ppts.push({x: mouse.x, y: mouse.y});
		
		if (ppts.length < 3) {
			var b = ppts[0];
			tmp_ctx.beginPath();
			//ctx.moveTo(b.x, b.y);
			//ctx.lineTo(b.x+50, b.y+50);
			tmp_ctx.arc(b.x, b.y, tmp_ctx.lineWidth / 2, 0, Math.PI * 2, !0);
			tmp_ctx.fill();
			tmp_ctx.closePath();
			
			return;
		}
		
		// Tmp canvas is always cleared up before drawing.
		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
		
		tmp_ctx.beginPath();
		tmp_ctx.moveTo(ppts[0].x, ppts[0].y);
		
		for (var i = 1; i < ppts.length - 2; i++) {
			var c = (ppts[i].x + ppts[i + 1].x) / 2;
			var d = (ppts[i].y + ppts[i + 1].y) / 2;
			
			tmp_ctx.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
		}
		
		// For the last 2 points
		tmp_ctx.quadraticCurveTo(
			ppts[i].x,
			ppts[i].y,
			ppts[i + 1].x,
			ppts[i + 1].y
		);
		tmp_ctx.stroke();
		
	};
	
}());
