$(document).ready(function(){
	var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext('2d');
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ff0000";
  
  var sX,sY,cX,cY;
  var canvasX = $(canvas).offset().left;
  var canvasY = $(canvas).offset().top;
  var draw = false;
  
  // click 시 draw 시작
  $("canvas").mousedown(function(e){
    sX=parseInt(e.clientX-canvasX);
    sY=parseInt(e.clientY-canvasY);
    draw = true;
  })
  $("canvas").mousemove(function(e){
    if(draw){
      cX=parseInt(e.clientX-canvasX);
      cY=parseInt(e.clientY-canvasY);
      ctx.clearRect(0,0,canvas.width,canvas.height); //clear canvas
      ctx.strokeRect(sX,sY,cX-sX,cY-sY);
    }
  })
  // 마우스 놓으면 rectangle 완성 및 popup 생성
  $("canvas").mouseup(function(e){
    draw = false;
  })
})