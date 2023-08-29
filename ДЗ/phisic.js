
const { mat2, mat3, mat4, vec2, vec3, vec4 } = glMatrix;
 
function Ball(position, radius) {
	
    this.position = position
    this.positionStart = vec3.clone(position)
    this.radius = radius
    this.vx = 0;
    this.vy = 0
	
    this.bounce = 1; //по моему как раз или нет надо вспомнить да эт опо моему как  раз и есть неупругость 
	
    this.setStartPosition = function () {
        this.position = vec3.clone(this.positionStart)
    }
}

function Wall(x, y) { //невидимая стена чтобы опрелелять когда шарик столкнется со стеной
    this.x = x;
    this.y = y
}

function Phisic() {
	
    this.ball = new Ball(vec3.fromValues(0, 4, 0), 1)	 
    this.wall = new Wall(5, 0)
    this.gravity = 9.81

    this.setPositionBallByTime = function (time) {

        var isDown=false;
        this.ball.setStartPosition()
        var startTime = 0
        var speedY = this.ball.vy
        var y = this.ball.position[1]
		
        while (true) {
			
            timeMove = 0.01
            startTime += timeMove
			
			//y
			y = this.ball.vy*startTime-(this.gravity/2)*(startTime*startTime) + this.ball.positionStart[1]

            if (y <= this.wall.y + this.ball.radius) {
                isDown=true
                time = startTime
                break
            }
            if (startTime >= time) {
                break;
            }
        }
		
        this.ball.position[1] = y

        //Лимит для функции
        var limitDistance = 9999999; //дистанция до столкновения со стеной
		var scalar = this.ball.vx / Math.abs(this.ball.vx); //определяет в какую сторону движется шар

		if (scalar > 0) {
			limitDistance = this.wall.x - (this.ball.positionStart[0] + this.ball.radius)
		}
		
		var paramMove = this.getDistance(time, Math.abs(this.ball.vx), Math.abs(limitDistance))
		this.ball.position[0] = this.ball.positionStart[0] + (paramMove["len"]) * scalar;
		
		if (paramMove["time"] < time) { //если время меньше общего то значит он столкнулся со стеной 
		//вермя которое нао чтобы столкнуться меньше чем время которое передается в функцию это означает чтобы
		// надо вычилсить растояние которое он пройдет после столкновения с остеной 

                paramMove = this.getDistance(time - paramMove["time"], paramMove["speed"] * this.ball.bounce, 99999)


                this.ball.position[0] -= paramMove["len"]
        }
        return isDown
    }
	 
    this.getDistance = function (time, speed, limitDistance) {


        var len = 0

        var timeTotal = 0;
		
		potentialDistance = speed*time
		
		if (potentialDistance < limitDistance) {
			timeTotal = time
			len = potentialDistance
			speed = 0
		} else {

			timeTotal = limitDistance/speed
			len = limitDistance
			speed = speed 
		}

        return { "len": len, "time": timeTotal, "speed": speed };
    }
}