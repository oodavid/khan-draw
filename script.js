(function() {
	// Tools, Shortcuts, Auto-Click #1
	$(document).ready(function(e){
		$('#tools').on('click', '.color', colorClick);
		prepareRecorder();
		$('#start').on('click', startCountdown);
		$('#count').on('click', cancelCountdown);
		$('#stop').on('click', stopRecording);
		$('.info').on('click', showInfo);
		$('#info-close').on('click', hideInfo);
		storeCanvasPosition();
		$(document).on('keydown', keyDown);
		$('#sketch').on('mousedown', startDrawing);
		$(document).on('mousemove',  updateDrawing);
		$(document).on('mouseup',    endDrawing);
		$('.color:contains("1")').click();
		// Todo list
		log('todo: prevent color change during draw');
		log('todo: tap to create a dot fails when using the ALT modifier');
		log('todo: automatically upload to youtube');
		log('todo: get a better SSL certificate from letsencrypt.org');
		log('todo: canvas panning');
		log('todo: cut, copy, paste');
		log('todo: eraser');
		log('todo: image upload - maybe a \'clipboard\' sidebar that the user can pre-populate?');
		log('---------')
	});
	// Color selection
	var selectedColor = null; // A number from 0-9
	function colorClick(el){
		setColor($(this).css('background-color'));
		selectedColor = parseInt($(this).text(), 10);
	}
	function setColor(color){
		ctx2.strokeStyle = color;
		ctx2.fillStyle   = color;
		$('#logo').css('background-color', color);
	}
	// Countdown
	var countDown;
	function startCountdown(){
		$('#start, #stop').hide();
		$('#count').text(3).show();
		countDown = setInterval(function(){
			var n = parseInt($('#count').text(), 10);
			if(n > 1){
				$('#count').text(--n);
			} else {
				startRecording();
				clearInterval(countDown);
			}
		}, 1000);
	}
	function cancelCountdown(){
		clearInterval(countDown);
		$('#stop, #count').hide();
		$('#start').show();
		stopTimer();
	}
	// Video recording
	var recordAudio;
	var canvasRecorder;
	function prepareRecorder(){
		canvasRecorder = RecordRTC($('#sketch')[0], {
			type: 'canvas',
			grabMouse: false
		});
	}
	function startRecording(){
		log('Requesting microphone access...');
		// Request access to the microphone, then begin
		navigator.getUserMedia({ audio: true }, function(stream) {
			recordAudio = RecordRTC(stream, {
				type: 'audio',
				recorderType: StereoAudioRecorder // force WebAudio for all browsers even for Firefox/MS-Edge
			});
			recordAudio.initRecorder(function() {
				canvasRecorder.startRecording();
				recordAudio.startRecording();
			});
			// UI
			$('#start, #count').hide();
			$('#stop').show();
			startTimer();
		}, function(error){
			log(error);
		});
	}
	function stopRecording(){
		log('Stopping recording...');
		// UI
		$('#stop, #count').hide();
		$('#start').show();
		stopTimer();
		// Stop the audio + video
		recordAudio.stopRecording(function(){
			canvasRecorder.stopRecording(function(){
				log('Merging Video and Audio streams (this may take a moment to begin)');
            	convertStreams(canvasRecorder.blob, recordAudio.blob);
				// window.open(urlA);
				// window.open(urlV);
			});
		});
	}
	// Timer - 12:34:56
	var startTime;
	var timerInterval;
	function startTimer(){
		stopTimer();
		startTime = Date.now();
		timerInterval = setInterval(renderTime, 50);
	}
	function stopTimer(){
		if(timerInterval){
			clearInterval(timerInterval);
		}
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
	// Volume
	function setVolumePct(pct){
		$('#volume').css('width', pct+'%');
	}
	// Popup
	function showInfo(e){
		$('#info-popup').show();
		return false;
	}
	function hideInfo(){
		$('#info-popup').hide();
	}
	// Keyboard
	function keyDown(e){
		if(e.which >=48 && e.which <= 57){ // Numbers 0-9
			$('.color:contains("'+(e.which-48)+'")').click();
		} else if(e.which == 9){
			selectedColor += (e.shiftKey ? -1 : 1);
			selectedColor = (10+selectedColor)%10;
			$('.color:contains("'+selectedColor+'")').click();
			e.preventDefault();
			return false;
		}
	}
	
	

	// Reference both canvases, define the initial stroke
	var canvas  = document.querySelector('#canvas');
	var ctx     = canvas.getContext('2d');
	var canvas2 = document.querySelector('#canvas2');
	var ctx2    = canvas2.getContext('2d');
		ctx2.lineWidth   = 3;
		ctx2.lineJoin    = 'round';
		ctx2.lineCap     = 'round';
		ctx2.strokeStyle = 'blue';
		ctx2.fillStyle   = 'blue';
	// For tracking the state
	var mouseX    = Infinity;
	var mouseY    = Infinity;
	var points    = [];
	var lastPoint = {};
	var lastAlt   = false;
	// Cache the canvas position (no need to calculate every time)
	var canvasX;
	var canvasY;
	function storeCanvasPosition(){
		var o = $('#canvas').offset();
		canvasX = o.left;
		canvasY = o.top;
	}
	// Mapped to mouse events
	var isDrawing = false;
	function startDrawing(e){
		if(!isDrawing){
			isDrawing = true;
			addPoint();
			drawCurve();
		}
	}
	function updateDrawing(e){
		mouseX = (e.pageX-canvasX);
		mouseY = (e.pageY-canvasY);
		// HACK - holding the ALT key should also trigger drawings...
		if(!isDrawing && !lastAlt && e.altKey){
			startDrawing(e);
		}
		if(isDrawing){
			addPoint();
			drawCurve();
		}
		if(isDrawing && lastAlt && !e.altKey){
			endDrawing(e);
		}
		moveCursor();
		lastAlt = e.altKey;
	}
	function endDrawing(e){
		if(isDrawing){
			isDrawing = false;
			drawFinalCurve();
			clearPoints();
		}
	}
	function moveCursor(){
		$('#cursor').css({
			'top':  (mouseY-6)+'px',
			'left': (mouseX-6)+'px'
		});
	}
	// Curve handling
	function addPoint(){
		if(mouseX != lastPoint.x || mouseY != lastPoint.y){
			points.push({
				x: mouseX,
				y: mouseY,
			});
		}
		lastPoint.x = mouseX;
		lastPoint.y = mouseY;
	}
	function clearPoints(){
		points.length = 0;
		lastPoint.x = Infinity;
		lastPoint.y = Infinity;
	}
	function drawFinalCurve(){
		ctx.drawImage(canvas2, 0, 0); // Write down to real canvas
		ctx2.clearRect(0, 0, canvas2.width, canvas2.height); // Clearing tmp canvas
	}
	function drawCurve(){
		// Clear before drawing
		ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
		// Quadratics after we have 3 points
		if (points.length < 3) {
			var b = points[0];
			ctx2.beginPath();
			ctx2.arc(b.x, b.y, ctx2.lineWidth / 2, 0, Math.PI * 2, !0);
			ctx2.fill();
			ctx2.closePath();
			return;
		}
		// Quadratics
		ctx2.beginPath();
		ctx2.moveTo(points[0].x, points[0].y);
		for (var i = 1; i < points.length - 2; i++) {
			var c = (points[i].x + points[i + 1].x) / 2;
			var d = (points[i].y + points[i + 1].y) / 2;
			ctx2.quadraticCurveTo(points[i].x, points[i].y, c, d);
		}
		// For the last 2 points
		ctx2.quadraticCurveTo(
			points[i].x,
			points[i].y,
			points[i + 1].x,
			points[i + 1].y
		);
		ctx2.stroke();
	}







	// Merge via FFMPEG
	var worker;
	function convertStreams(videoBlob, audioBlob) {
	    var vab;
	    var aab;
	    var buffersReady;
	    var workerReady;
	    var posted = false;
		if(!worker){
			worker = new Worker("worker.js");
		}
	    var fileReader1 = new FileReader();
	    fileReader1.onload = function() {
	        vab = this.result;
	        if(aab){
	        	buffersReady = true;
	        }
	        if(buffersReady && workerReady && !posted){
	        	postMessage()
	        };
	    };
	    var fileReader2 = new FileReader();
	    fileReader2.onload = function() {
	        aab = this.result;
	        if(vab){
	        	buffersReady = true;
	        }
	        if(buffersReady && workerReady && !posted){
	        	postMessage();
	        }
	    };
	    fileReader1.readAsArrayBuffer(videoBlob);
	    fileReader2.readAsArrayBuffer(audioBlob);
	    worker.onmessage = function(event){
	        var message = event.data;
	        if (message.type == "ready") {
	        	log('ffmpeg_asm.js has been loaded');
	            workerReady = true;
	            if (buffersReady)
	                postMessage();
	        } else if (message.type == "stdout") {
	            log(message.data);
	        } else if (message.type == "start") {
	        	log('ffmpeg_asm.js has started working');
	        } else if (message.type == "done") {
	            log(JSON.stringify(message));
	            var result = message.data[0];
	            log(JSON.stringify(result));
	            var blob = new Blob([result.data], {
	                type: 'video/mp4'
	            });
	            log(JSON.stringify(blob));
	            PostBlob(blob);
	        }
	    };
	    var postMessage = function(){
	        posted = true;
	        worker.postMessage({
	            type: 'command',
	            arguments: [
					'-i', 'video.webm',
					'-i', 'audio.wav',
					'-vcodec', 'copy',
					'-strict', '-2',
					'khandraw.webm'
	            ],
	            files: [
	                { name: 'video.webm', data: new Uint8Array(vab) },
	                { name: 'audio.wav',  data: new Uint8Array(aab) }
	            ]
	        });
	    };
	}
	var h2 = document.querySelector('h2');
	function PostBlob(blob) {
		log('opening page...');
		window.open(URL.createObjectURL(blob));
	}
	function log(message) {
		$('#debug').append($('<div>').text(message));
		$('#debug')[0].scrollTop = $('#debug')[0].scrollHeight;
	}

}());
