const w : number = window.innerWidth
const h : number = window.innerHeight
const scGap : number = 0.02
const strokeFactor : number = 90
const sizeFactor : number = 2.9
const delay : number = 30
const nodes : number = 5
const lines : number = 2
const backColor : string = "#BDBDBD"
const foreColor : string = "#3f51b5"

class ScaleUtil {

      static maxScale(scale : number, i : number, n : number) : number {
          return Math.max(0, scale - i / n)
      }

      static divideScale(scale : number, i : number, n : number) : number {
          return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n
      }

      static sinify(scale : number) : number {
          return Math.sin(scale * Math.PI)
      }
}

class DrawingUtil {

    static drawLine(context : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number) {
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.stroke()
    }

    static drawSquareLine(context : CanvasRenderingContext2D, k : number, size : number, scale : number) {
        const sf : number = ScaleUtil.sinify(scale)
        const sfi : number = ScaleUtil.divideScale(sf, k, size)
        const sfi1 : number = ScaleUtil.divideScale(sfi, 0, 2)
        const sfi2 : number = ScaleUtil.divideScale(sfi, 1, 2)
        const sj : number = 1 - 2 * k
        for (var i = 0; i < 2; i++) {
            context.save()
            context.translate(0, -size * sfi1 * sj)
            context.rotate(Math.PI / 2 * i * sfi2)
            DrawingUtil.drawLine(context, 0, 0, 0, size * sfi1 * sj)
            context.restore()
        }
    }

    static drawSquareLines(context : CanvasRenderingContext2D, size : number, scale : number) {
        for (var j = 0; j < 2; j++) {
            DrawingUtil.drawSquareLine(context, j, size, scale)
        }
    }

    static drawSLNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor
        context.strokeStyle = foreColor
        const gap : number = h / (nodes + 1)
        const size : number = gap / sizeFactor
        context.save()
        context.translate(w / 2, gap * (i + 1))
        DrawingUtil.drawSquareLines(context, size, scale)
        context.restore()
    }
}

class Stage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
    }

    handleTap() {
        this.canvas.onmousedown = () => {

        }
    }

    static init() {
        const stage : Stage = new Stage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {

    scale = 0
    dir = 0
    prevScale = 0

    update(cb : Function) {
        this.scale += scGap * this.dir
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {

    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, delay)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class ASLNode {

    state : State = new State()
    next : ASLNode
    prev : ASLNode

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new ASLNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawSLNode(context, this.i, this.state.scale)
        if (this.next) {
            this.next.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : ASLNode {
        var curr : ASLNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class AlternatingSquareLine {

    curr : ASLNode = new ASLNode(0)
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.curr.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {

    asl : AlternatingSquareLine = new AlternatingSquareLine()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.asl.draw(context)
    }

    handleTap(cb : Function) {
        this.asl.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.asl.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}
