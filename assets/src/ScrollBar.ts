import { _decorator, Node, Component, UITransform, Graphics, Size, Color } from "cc";
import { VirtualList } from "./VirtualList";
const { ccclass } = _decorator;

/**
 * 滚动条
 */
@ccclass("ScrollBar")
export default class ScrollBar extends Component {
    /** 虚拟列表 */
    private _list: VirtualList = null;
    /** 滑块 */
    private _slider: Node;
    /** 滑块变换组件 */
    private _sliderTransformer: UITransform = null;
    /** 滑块绘制组件 */
    private _sliderRenderer: Graphics = null;
    /** 剩余时间 */
    private _interval: number = 0;
    /** 显示时间 */
    private _displayTime: number = 1;
    /** 滑块扁度 */
    private _sliderSpan: number = 2;
    /** 滑块颜色 */
    private _sliderColor: Color = new Color(0, 0, 0, 80);

    /** 滑块变换组件 */
    private get sliderTransformer() {
        return (this._sliderTransformer ||= this._slider.getComponent(UITransform) || this._slider.addComponent(UITransform));
    }

    /** 滑块绘制组件 */
    private get sliderRenderer() {
        return (this._sliderRenderer ||= this._slider.getComponent(Graphics) || this._slider.addComponent(Graphics));
    }

    /** 显示时间 */
    public set sliderDisplayTime(time: number) {
        this._displayTime = Math.max(0, time);
    }

    /** 滑块扁度 */
    public set sliderSpan(span: number) {
        this._sliderSpan = Math.max(1, span | 0);
    }

    /** 滑块颜色 */
    public set sliderColor(c: Color) {
        this._sliderColor.set(c);
    }

    /** 滑块尺寸 */
    private get sliderSize() {
        const cs = this._list.containerSize;
        const vs = this._list.viewSize;
        if (this._list.horizontal) {
            return new Size((vs.width / cs.width) * vs.width, this._sliderSpan);
        } else {
            return new Size(this._sliderSpan, (vs.height / cs.height) * vs.height);
        }
    }

    protected onLoad(): void {
        this._slider = new Node("slider");
        this.node.addChild(this._slider);
    }

    protected onDestroy(): void {
        this.unbind();
    }

    protected lateUpdate(dt: number): void {
        if (this._list && this._displayTime && this._interval >= 0) {
            this._interval -= dt;
            this._slider.active = this._interval > 0;
        }
    }

    /**
     * 绑定虚拟列表
     * @param list 虚拟列表
     */
    public bind(list: VirtualList) {
        this._list = list;
        this._list.container.on(Node.EventType.TRANSFORM_CHANGED, this.refresh, this);
        this._list.container.on(Node.EventType.SIZE_CHANGED, this.refresh, this);
    }

    /** 与虚拟列表解绑 */
    public unbind() {
        if (this._list) {
            this._list.container.off(Node.EventType.TRANSFORM_CHANGED, this.refresh, this);
            this._list.container.off(Node.EventType.SIZE_CHANGED, this.refresh, this);
            this._list = null;
            this.sliderRenderer.clear();
        }
    }

    /** 刷新滑块位置与尺寸 */
    private refresh() {
        if (this._list.isMinSize) {
            this._slider.active = false;
            return;
        }
        const { x: px, y: py } = this._list.containerPos;
        const { width: vw, height: vh } = this._list.viewSize;
        const { width: cw, height: ch } = this._list.containerSize;
        const { width: fw, height: fh } = this._list.frameSize;
        const { width: sw, height: sh } = this.sliderSize;
        let x = 0,
            y = 0;
        this.sliderRenderer.clear();
        this.sliderRenderer.lineWidth = 1;
        this.sliderRenderer.fillColor = this._sliderColor;
        this.sliderRenderer.roundRect(0, 0, sw, sh, 2);
        this.sliderRenderer.fill();
        if (this._list.horizontal) {
            x = (-px / (cw - vw)) * (vw - sw) - (sw / 2 + vw / 2);
            x = Math.min(vw / 2 - sw, Math.max(-vw / 2, x));
            y = -fh / 2;
        } else {
            x = fw / 2 - this._sliderSpan;
            y = (-py / (ch - vh)) * (vh - sh) + vh / 2 - sh / 2;
            y = Math.min(vh / 2 - sh, Math.max(-vh / 2, y));
        }
        this._slider.setPosition(x, y);
        this._interval = this._displayTime;
    }
}
