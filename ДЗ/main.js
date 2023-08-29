

const VSHADER_SOURCE =
	'attribute vec4 aVertexPosition;\n' +
	'attribute vec4 aVertexColor;\n' +
	
	'uniform mat4 uMatProj;\n' +
	'uniform mat4 uMatModel;\n' + //записывается перемещение шарика

	'varying lowp vec4 vColor;\n' +
	
	'void main(void) {\n' +
		'gl_Position = uMatProj * uMatModel * aVertexPosition;\n' +
		'vColor=aVertexColor;\n' +
	'}\n';

	const FSHADER_SOURCE =
		'precision mediump float;\n' +
		'varying lowp vec4 vColor;\n' + 

		'void main(void) {\n' +
			'gl_FragColor = vColor;\n' +
		'}\n'
	
	
function Main() {

    const { mat2, mat3, mat4, vec2, vec3, vec4 } = glMatrix;

    this.gl = null
    this.canvas = null
    this.w = 1080
    this.h = 1080
    this.buffersWall = null //буфер для стены
    this.buffersBall = [] //буфер для мяча
	
	this.matrixModelBall = null
	this.view = null //камера

    this.atrVertext = [] 
    this.atrColor = [] 
	 
	this.uMatProj = null
	this.uMatModel = []
		
    this.isPlay = false;
    this.timePlayStart = 0;

    this.init = function () {

        this.inputSpeedX = new InputPanel("speed_x") //ссылка на элемент в хтмл
        this.inputSpeedY = new InputPanel("speed_y")
        this.inputCoefElasticity = new InputPanel("coeff_elasticity") 
        this.inputTime = new InputPanel("time")

        this.phisic = new Phisic()

        this.imagePlay = document.getElementsByClassName("play")[0]
        this.imagePlay.th = this
        this.imagePlay.addEventListener("click", this.onClick)

        this.canvas = document.getElementById('webgl');

        this.gl = getWebGLContext(this.canvas);
		if (!this.gl) {
			console.log('Failed to get the rendering context for WebGL');
			return;
		}

		if (!initShaders(this.gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
			console.log('Failed to intialize shaders');
			return;
		}

        if (this.gl != null) {

            this.gl.enable(this.gl.DEPTH_TEST); //буфер глубины			
			main.initProperties(0); //связка с шейдером
			main.initProperties(1);
			
            //Цвет для стен
            var color = [71.0 / 255.0, 74.0 / 255.0, 81.0 / 255.0, 1]
            //Цвет для шара
            var colorBall = [255.0 / 255.0, 255.0 / 255.0, 0.0 / 255.0, 1]

            this.buffersWall = this.createWall(color, 5) //возвращает буфер которую потом в дроу надо помещать она по сути составляет объект 
			//Задание объекта сферы (стеки, слайсы, цвет, радиус)
			
            this.buffersBall = this.createSphere(8, 20, colorBall, 1)
			
            this.matrixModelBall = mat4.create();

            this.matrixProjection = mat4.create();
            this.setMprojectionMatrix() //устанавливает матрицу проекции

            this.view = mat4.create();
            this.translate(this.view, vec3.fromValues(0, 0, -10)) //перемещение камеры
            this.rotateX(this.view, -(Math.PI / 2.5)) //вращение камеры
            this.rotateZ(this.view, Math.PI / 5)
		}

        setInterval(this.process, 1) //каждую мсек запускает процесс
    }


    this.onClickElement = function (ele) { //обработка событий с нажатием кнопочки

        if (ele) {
            if (ele == this.imagePlay) {
                if (this.isPlay) {
                    this.stop()
                } else {
                    this.play()
                }
            }
        }
    }

    this.onClick = function (e) {

        if (e.target.th) {
            e.target.th.onClickElement(e.target)
        }
    }

    this.play = function () {
        this.timePlayStart = new Date().getTime()
        this.isPlay = true
        this.imagePlay.src = "./stop.png"
    }

    this.stop = function () {

        this.isPlay = false
        this.imagePlay.src = "./play.png?v=1"
    }
	 
    this.setMprojectionMatrix = function () {
        var scaler = 75 // просто константа для изменения размеров стены
        mat4.ortho(this.matrixProjection, -this.w / scaler, this.w / scaler, -this.h / scaler, this.h / scaler, 0.1, 100.0);
    }

    this.process = function () {
        main.phisicRun()
        main.graphicRun()
    }
	
	    this.newMatrix = function () {
        var mat = mat4.create();
        return mat
    }

    this.rotateX = function (out, rad) {
        var mat = this.newMatrix()
        mat4.rotateX(mat, mat, rad)
        mat4.multiply(out, out, mat)

    }

    this.rotateY = function (out, rad) {
        var mat = this.newMatrix()
        mat4.rotateY(mat, mat, rad)
        mat4.multiply(out, out, mat)

    }

    this.rotateZ = function (out, rad) {
        var mat = this.newMatrix()
        mat4.rotateZ(mat, mat, rad)
        mat4.multiply(out, out, mat)

    }

    this.translate = function (out, vec) {
        var mat = this.newMatrix()
        mat = mat4.translate(mat, mat, vec)
        mat4.multiply(out, out, mat)

    }
	 
    this.initProperties = function (id) { //связывание переменных из программы с шейдерными переменными

		this.atrVertext[id] = this.gl.getAttribLocation(this.gl.program, "aVertexPosition"); //массив потому что два объекта
		this.gl.enableVertexAttribArray(this.atrVertext[id]);

		this.atrColor[id] = this.gl.getAttribLocation(this.gl.program, "aVertexColor");
		this.gl.enableVertexAttribArray(this.atrColor[id]);

		this.uMatProj = this.gl.getUniformLocation(this.gl.program, "uMatProj")

		this.uMatModel[id] = this.gl.getUniformLocation(this.gl.program, "uMatModel") 
    }

    this.createBuffer = function (gl, vertices) {

        var buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        return buffer
    }


    this.createBufferIndex = function (gl, indices) {

        var buffer = gl.createBuffer();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        return buffer
    }

	 
    this.createSphere = function (stacks, slices, color, radius) {
		//сфера разбивается на прямоугольники
		//наверху треугольники
		//меридианы и параллели
		//stacks количество прямоугов в пределах горизонтального уровня
		//slices количество прямоугов в пределах вертикального уровня
		const n = (stacks - 1)*slices + 2; // количество вершин

		let zenith = 0; //zenith angle //theta
		let azimuth = 0; //azimuth angle //phi
		
		const zStep = Math.PI/stacks; //zenith angle step //шаги углов 
		const aStep = 2*Math.PI/slices; //azimuth angle step
		
		let indArr = new Array(); //index array
		let indIter = 0; //index iterator
		
		//Making coord and color arrays
		let coordArr = new Array();
		let colorArr = new Array();
		
		//initializing vertices coordinates
		//initializing top vertice //северный полюс
		coordArr[0] = 0; //xzy
		coordArr[1] = radius;
		coordArr[2] = 0;
		
		colorArr.push(color[0], color[1], color[2], color[3]);
		
		//вычисление координат вершин лежащих на поверхности сферы
		for (let st = 1; st < stacks; st++)
		{
			zenith = zenith + zStep; //change zenith angle
			
			for (let sl = 0; sl < slices; sl++)
			{
				let at = (st - 1) * slices + sl + 1; //calculate vertice index
				
				coordArr[at*3] = radius * Math.sin(zenith) * Math.sin(azimuth); //calculate vertice coords
				coordArr[at*3 + 1] = radius * Math.cos(zenith);
				coordArr[at*3 + 2] = radius * Math.sin(zenith) * Math.cos(azimuth);
				colorArr.push(color[0], color[1], color[2], color[3]);
				
				if(sl == 0) //if first stack vertice
				{
					indArr[indIter] = at; //add vertice index once
					indIter++;
				}
				else //if not 
				{
					indArr[indIter] = at;
					indArr[indIter + 1] = at; //add vertice index twice
					indIter = indIter + 2;
				}
				
				azimuth = azimuth + aStep; //change azimuth angle
				
			}
			
			indArr[indIter] = (st - 1) * slices + 1; //add index of first stack vertice to finish the stack properly
			indIter++;
			
			//connecting vertices of different stacks
			
			if (st == 1) //if first stack
			{
				for (let sl = 0; sl < slices; sl++) //connect top vertice to each stack vertice
				{
					let at = (st - 1) * slices + sl + 1;
					indArr[indIter] = 0;
					indArr[indIter + 1] = at;
					indIter = indIter + 2;
				}
			}
			else //if not
			{
				for (let sl = 0; sl < slices; sl++) //connect vertices respectively
				{
					let atPr = (st - 2) * slices + sl + 1;
					let at = (st - 1) * slices + sl + 1;
					indArr[indIter] = atPr;
					indArr[indIter + 1] = at;
					indIter = indIter + 2;
				}
			}
			azimuth = 0; //reset azimuth angle
		}
		
		//initializing bottom vertice
		coordArr[(n - 1)*3] = 0;
		coordArr[(n - 1)*3 + 1] = -radius;
		coordArr[(n - 1)*3 + 2] = 0;
		
		colorArr.push(color[0], color[1], color[2], color[3]);
		
		//connecting last stack with bottom vertice
		for (let sl = 0; sl < slices; sl++)
		{
			let at = (stacks - 2)*slices + sl + 1;
			indArr[indIter] = n - 1;
			indArr[indIter + 1] = at;
			indIter = indIter + 2;
		}
		
		
		var bufferPoints = this.createBuffer(this.gl, coordArr);
		var bufferIndex = this.createBufferIndex(this.gl, indArr);
		var bufferColor = this.createBuffer(this.gl, colorArr)

        return [bufferPoints, bufferIndex, bufferColor, indArr.length]
    }

	 
    this.createWall = function (color, scale) {

        var gl = this.gl

        var points = [

            //back
            -1, 1, 0, 1, 1, 0, //0 1
            -1, -1, 0, 1, -1, 0,//2 3
            //right
            1, 1, 2, 1, 1, 0, //4 5
            1, -1, 2, 1, -1, 0,//6 7
        ]

        for (let index = 0; index < points.length; index++) {
            points[index] *= scale

        }


        var bufferPoints = this.createBuffer(gl, points)
   
        var indices = [

            //back
            1, 0, 2, 1, 2, 3,

            //right
            5, 4, 6, 5, 6, 7
        ]


        var bufferIndex = this.createBufferIndex(gl, indices)

        var colors = []
        for (var j = 0; j < points.length / 3; ++j) {

            colors = colors.concat(color);
        }

        var bufferColor = this.createBuffer(gl, colors)


        return [bufferPoints, bufferIndex, bufferColor]
    }

	 
    this.renderWall = function (buffers, martix) {

		var id = 1
        var gl = this.gl
		
		const PSize = this.atrVertext[id].BYTES_PER_ELEMENT

        gl.uniformMatrix4fv(this.uMatModel[id], false, martix)
		

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[0]);
        gl.vertexAttribPointer(this.atrVertext[id], 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[2]);
        gl.vertexAttribPointer(this.atrColor[id], 4, gl.FLOAT, false, 0, PSize * this.atrVertext[id].length);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers[1]);
        gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);
    }


    this.renderSphere = function (buffers, martix) {
		
        var gl = this.gl
		var id = 0
		
		const PSize = this.atrVertext[id].BYTES_PER_ELEMENT
		
        gl.uniformMatrix4fv(this.uMatModel[id], false, martix)
		
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers[0]);
		gl.vertexAttribPointer(this.atrVertext[id], 3, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers[2]);
		gl.vertexAttribPointer(this.atrColor[id], 4, gl.FLOAT, false, 0, PSize * this.atrVertext[id].length);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers[1]);
		console.log(buffers[3])
        gl.drawElements(gl.LINES, buffers[3], gl.UNSIGNED_SHORT, 0);
    }

 
    this.phisicRun = function () {

        if (this.phisic) { 
			this.phisic.ball.vx = this.inputSpeedX.getFloatValue()
            this.phisic.ball.vy = this.inputSpeedY.getFloatValue()
			this.phisic.ball.bounce = this.inputCoefElasticity.getFloatValue()
            var time = this.inputTime.eleRange.value //из ползунка значение берется
            var isDown = this.phisic.setPositionBallByTime(this.inputTime.getFloatValue()) //упал ли?

            if (isDown) {

                this.stop()
            }

        }

        if (this.isPlay) {
            var time = new Date().getTime()
            if (time > this.timePlayStart) {
                var valueFloat = this.inputTime.getFloatValue()
                var add = (time - this.timePlayStart) / 1000.0
                valueFloat += add
                this.timePlayStart = time

                this.inputTime.setFloat(valueFloat)
            }
        }
    }


    this.graphicRun = function () { //отрисовка нового положения

        if (this.gl != null) {
            var gl = this.gl

            gl.clearColor(1, 1, 1, 1);

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.enable(gl.DEPTH_TEST)

			
			this.matrixModelBall = mat4.create();
            mat4.translate(this.matrixModelBall, this.matrixModelBall, vec3.fromValues(this.phisic.ball.position[0], 0, this.phisic.ball.position[1]))

            mat4.multiply(this.matrixModelBall, this.view, this.matrixModelBall)

            gl.uniformMatrix4fv(this.uMatProj, false, this.matrixProjection)
            

            this.renderSphere(this.buffersBall, this.matrixModelBall)
            this.renderWall(this.buffersWall, this.view)
        }
    }
}

var main = new Main()