import {
    _decorator,
    Component,
    Node,
    instantiate,
    CCInteger,
    Mask,
    Enum,
    UITransform,
    Vec2,
    Graphics,
    Color,
    EventTouch,
    Vec3,
    tween,
    Tween,
    Size,
    Label,
    Sprite,
} from "cc";
const { ccclass, property } = _decorator;

const __TEST__ = true;

/** 列表滚动方向 */
export const LIST_DIRCTION = Enum({
    /** 水平 */
    HORIZONTAL: 0,
    /** 垂直 */
    VERTICAL: 1,
});

/** 列表布局方式 */
export const LIST_LAYOUT = Enum({
    /** 单行单列 */
    SINGLE_LINE: 0,
    /** 多行多列 */
    MULTI_LINE: 1,
    /** 自由增长 */
    AUTO_GROW: 2,
});

const LAST_POS = new Vec2();
const DROP_POS = new Vec2();
const LEAVE_POS = new Vec2();
const AUTO_ANIMATE_DELTA = 0.1;
const SCROLL_DELTA = 300; // 惯性滚动触发阈值【时间】
const SCROLL_SPAN = 50; // 惯性滚动触发阈值【距离】
let DROP_AT = 0;
let LEAVE_AT = 0;

/** 虚拟子项 */
class VirtualItem {
    /** 子项索引 */
    public i: number = 0;
    /** 子项宽度 */
    public w: number = 0;
    /** 子项高度 */
    public h: number = 0;
    /** 子项横坐标 */
    public x: number = 0;
    /** 子项纵坐标 */
    public y: number = 0;
}

@ccclass("VList")
export class VList extends Component {
    private _container: Node = null;
    private _containerTransform: UITransform = null;
    private _minWidth: number = 0;
    private _minHeight: number = 0;
    private _scrolling: boolean = false;
    private _scrollDelta: number = 0;
    private _scrollOffset: Vec2 = new Vec2();
    private _dataSource: any[] | null;
    private _startPos: Vec3 = null;
    protected _vitems: VirtualItem[] = [];

    @property({ displayName: "滚动方向", type: LIST_DIRCTION, group: { id: "1", name: "基础参数", displayOrder: 1 } })
    protected $direction = LIST_DIRCTION.VERTICAL;
    @property({ displayName: "布局方式", type: LIST_LAYOUT, group: { id: "1", name: "基础参数", displayOrder: 2 } })
    protected $layout = LIST_LAYOUT.SINGLE_LINE;
    @property({ displayName: "子项间距", type: CCInteger, group: { id: "1", name: "基础参数", displayOrder: 3 } })
    protected $spacing = 0;
    @property({ displayName: "惯性滚动", group: { id: "1", name: "基础参数", displayOrder: 4 } })
    protected $inertia = false;
    @property({ displayName: "左", type: CCInteger, group: { id: "2", name: "边距", displayOrder: 1 } })
    protected $paddingLeft = 0;
    @property({ displayName: "右", type: CCInteger, group: { id: "2", name: "边距", displayOrder: 2 } })
    protected $paddingRight = 0;
    @property({ displayName: "上", type: CCInteger, group: { id: "2", name: "边距", displayOrder: 3 } })
    protected $paddingTop = 0;
    @property({ displayName: "下", type: CCInteger, group: { id: "2", name: "边距", displayOrder: 4 } })
    protected $paddingBottom = 0;

    protected onLoad(): void {
        console.log("==load==");

        // 计算容器最小尺寸
        const { width, height } = this.node.getComponent(UITransform);
        const mw = width - this.$paddingLeft - this.$paddingRight;
        const mh = height - this.$paddingTop - this.$paddingBottom;
        this._minWidth = mw;
        this._minHeight = mh;

        // 创建遮罩
        const maskN = new Node("mask");
        const maskT = maskN.addComponent(UITransform);
        const maskC = maskN.addComponent(Mask);
        this.node.addChild(maskN);
        maskT.setContentSize(mw, mh);
        maskC.type = Mask.Type.GRAPHICS_RECT;
        maskC.inverted = false;
        maskC.enabled = true;

        // 创建容器
        const containerN = new Node("container");
        const containerC = containerN.addComponent(UITransform);
        const anchor = this.$direction == LIST_DIRCTION.HORIZONTAL ? new Vec2(0, 0.5) : new Vec2(0.5, 1);
        const pos = this.$direction == LIST_DIRCTION.HORIZONTAL ? new Vec3(-mw / 2, 0) : new Vec3(0, mh / 2);
        containerC.setContentSize(mw, mh);
        containerC.setAnchorPoint(anchor);
        maskN.addChild(containerN);
        this._containerTransform = containerC;
        this._container = containerN;
        containerN.setPosition(pos);
        this._startPos = pos.clone();

        if (__TEST__) {
            containerN.addComponent(Graphics);
            console.log(this);
        }
    }

    protected onEnable(): void {
        this.view.on(Node.EventType.TOUCH_START, this.onTouchDrop, this, true);
        this.view.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
        this.view.on(Node.EventType.TOUCH_END, this.onTouchLeave, this, true);
        this.view.on(Node.EventType.TOUCH_CANCEL, this.onTouchLeave, this, true);
    }

    protected onDisable(): void {
        this.view.off(Node.EventType.TOUCH_START, this.onTouchDrop, this, true);
        this.view.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
        this.view.off(Node.EventType.TOUCH_END, this.onTouchLeave, this, true);
        this.view.off(Node.EventType.TOUCH_CANCEL, this.onTouchLeave, this, true);
    }

    protected start(): void {
        console.log("==start==");
        this.data = new Array(100).fill(0).map((_, i) => i + 1);
        for (let i = 0; i < this._dataSource.length; i++) {
            const item = this.appendItem();
            const [width, height] = this.getItemSize(i);
            item.setPosition(0, -height / 2 - height * i - this.$spacing * (i + 1));
            item.getComponent(Sprite).color = new Color(Math.random() * 255, Math.random() * 255, Math.random() * 255);
            item.getChildByName("Label").getComponent(Label).string = (i + 1).toString();
        }
    }

    private appendItem() {
        const template = this.node.parent.getChildByName("Item");
        const item = instantiate(template);
        item.active = true;
        this._container.addChild(item);
        return item;
    }

    private drawBound() {
        if (__TEST__) {
            const { width, height } = this._containerTransform.contentSize;
            const pos = this.$direction == LIST_DIRCTION.HORIZONTAL ? new Vec3(0, -width / 2) : new Vec3(-width / 2, -height);
            const containerG = this._container.getComponent(Graphics);
            containerG.clear();
            containerG.lineWidth = 2;
            containerG.strokeColor = new Color(255, 0, 0);
            containerG.fillColor = new Color(0, 0, 0, 50);
            containerG.fillRect(pos.x, pos.y, width, height);
            containerG.stroke();
        }
    }

    /**
     * 落下
     * @param e 触摸事件
     */
    private onTouchDrop(e: EventTouch) {
        DROP_AT = Date.now();
        DROP_POS.x = e.getLocationX();
        DROP_POS.y = e.getLocationY();
        LAST_POS.x = this._container.position.x;
        LAST_POS.y = this._container.position.y;
    }

    /**
     * 容器尺寸
     */
    private get contentSize() {
        return this._containerTransform.contentSize;
    }

    /**
     * 拖拽
     * @param e 触摸事件
     */
    private onTouchMove(e: EventTouch) {
        this.stopScroll();
        const delta = e.getDelta();
        if (this.$direction == LIST_DIRCTION.HORIZONTAL) {
            LAST_POS.x += delta.x;
            this._container.setPosition(this._container.position.x + delta.x, this._container.position.y);
        } else {
            LAST_POS.y += delta.y;
            this._container.setPosition(this._container.position.x, this._container.position.y + delta.y);
        }
    }

    /**
     * 松开
     * @param e 触摸事件
     */
    private onTouchLeave(e: EventTouch) {
        console.log("--leave--", this._startPos.toString(), this._container.position.toString());
        if (this.checkBounce()) return;
        if (this.$inertia) {
            LEAVE_AT = Date.now();
            LEAVE_POS.x = e.getLocationX();
            LEAVE_POS.y = e.getLocationY();
            const delta = LEAVE_AT - DROP_AT;
            if (this.$direction == LIST_DIRCTION.HORIZONTAL && Math.abs(LEAVE_POS.x - DROP_POS.x) < SCROLL_SPAN) return;
            if (this.$direction == LIST_DIRCTION.VERTICAL && Math.abs(LEAVE_POS.y - DROP_POS.y) < SCROLL_SPAN) return;
            if (delta > SCROLL_DELTA) return;
            this._scrolling = true;
            this._scrollDelta = delta / 1000;
            this._scrollOffset.x = LEAVE_POS.x - DROP_POS.x;
            this._scrollOffset.y = LEAVE_POS.y - DROP_POS.y;
        }
    }

    /**
     * 检查回弹
     * @return
     */
    private checkBounce() {
        if (this.$direction == LIST_DIRCTION.HORIZONTAL) {
            if (this._container.position.x <= this._startPos.x) {
                this.scrollTo(this._startPos, AUTO_ANIMATE_DELTA);
                return true;
            } else if (this._container.position.x >= this._containerTransform.width - this.minWidth * 1.5) {
                const pos = new Vec3(this._containerTransform.width - this.minWidth * 1.5, this._container.position.y);
                this.scrollTo(pos, AUTO_ANIMATE_DELTA);
                return true;
            }
        } else {
            if (this._container.position.y < this._startPos.y) {
                this.scrollTo(this._startPos, AUTO_ANIMATE_DELTA);
                return true;
            } else if (this._container.position.y > this._containerTransform.height - this.minHeight / 2) {
                const pos = new Vec3(this._container.position.x, this._containerTransform.height - this.minHeight / 2);
                this.scrollTo(pos, AUTO_ANIMATE_DELTA);
                return true;
            }
        }
        return false;
    }

    /** 最小宽度 */
    public get minWidth() {
        return this._minWidth;
    }

    /** 最小高度 */
    public get minHeight() {
        return this._minHeight;
    }

    /** 视图节点 */
    public get view() {
        return this.node;
    }

    /** 容器节点 */
    public get container() {
        return this._container;
    }

    /**
     * 设置数据源
     * @param data 数据源
     */
    public set data(data: any[]) {
        if (data == null) {
            this.clear();
            return;
        }
        this._dataSource = data;
        this._containerTransform.setContentSize(this.calculateSize());
        this.drawBound();
    }

    /**
     * 清空数据源
     */
    public clear() {
        this._dataSource = null;
        const children = this._container.children;
        for (let i = children.length - 1; i >= 0; i--) {
            // @todo 回收
            // children[i].destroy();
        }
    }

    /**
     * 子项数量
     */
    public get count() {
        return this._dataSource ? this._dataSource.length : 0;
    }

    /**
     * 获取子项尺寸
     * @param index 索引
     * @returns
     */
    public getItemSize(index: number): [number, number] {
        // @todo
        return [1024, 120];
    }

    /**
     * 获取指定索引处的子项
     * @param index 索引
     * @returns
     */
    public getItemAt(index: number, force: boolean = false): Node | null {
        // @todo
        return null;
    }

    /**
     * 移除指定索引处的子项
     * @param index 索引
     */
    private removeAt(index: number) {
        // @todo
    }

    /**
     * 移除指定范围内的子项
     * @param start 开始索引
     * @param end 结束索引
     */
    private removeRange(start: number, end: number) {
        // @todo
    }

    /**
     * 计算容器尺寸
     * @returns
     */
    private calculateSize() {
        let width = 0,
            height = 0,
            size: [number, number];
        let hor = this.$direction == LIST_DIRCTION.HORIZONTAL;
        let spacing = this.$spacing;
        let count = this.count;
        for (let i = 0; i < count; i++) {
            size = this.getItemSize(i);
            if (hor) {
                width += size[0];
            } else {
                height += size[1];
            }
        }
        if (count > 0) {
            if (hor) {
                width += (count + 1) * spacing;
            } else {
                height += (count + 1) * spacing;
            }
        }
        width = Math.max(width, this._minWidth);
        height = Math.max(height, this._minHeight);
        return new Size(width, height);
    }

    /** 停止滚动 */
    public stopScroll() {
        Tween.stopAllByTarget(this._container);
        this._scrolling = false;
        this._scrollDelta = 0;
        this._scrollOffset.set(0, 0);
    }

    /**
     * 滚动到指定位置
     * @param position 目标位置
     * @param delta 动画时间
     */
    public scrollTo(position: Vec3, delta: number = 0) {
        this.stopScroll();
        tween(this._container).to(delta, { position: position }).start();
    }

    /**
     * 滚动到指定索引
     * @param index 索引
     * @param delta 动画时间
     */
    public scrollToIndex(index: number, delta: number = 0) {
        // @todo
        const pos = this._container.position;
    }

    /**
     * 滚动到最左侧
     * @param delta 动画时间
     */
    public scrollToLeft(delta: number = 0) {
        if (this.$direction == LIST_DIRCTION.HORIZONTAL) {
            this.scrollToIndex(0, delta);
        }
    }

    /**
     * 滚动到最左侧
     * @param delta 动画时间
     */
    public scrollToRight(delta: number = 0) {
        if (this.$direction == LIST_DIRCTION.HORIZONTAL) {
            this.scrollToIndex(this.count - 1, delta);
        }
    }

    /**
     * 滚动到最顶侧
     * @param delta 动画时间
     */
    public scrollToTop(delta: number = 0) {
        if (this.$direction == LIST_DIRCTION.VERTICAL) {
            this.scrollToIndex(0, delta);
        }
    }

    /**
     * 滚动到最底侧
     * @param delta 动画时间
     */
    public scrollToBottom(delta: number = 0) {
        if (this.$direction == LIST_DIRCTION.VERTICAL) {
            this.scrollToIndex(this.count - 1, delta);
        }
    }

    protected lateUpdate(dt: number): void {
        if (this._scrolling) {
            if (this._scrollDelta <= 0) {
                this.stopScroll();
                this.checkBounce();
                return;
            }
            if (this.checkBounce()) return;
            this._scrollDelta -= dt * 0.1;
            const speedX = this._scrollOffset.x * this._scrollDelta * 2;
            const speedY = this._scrollOffset.y * this._scrollDelta * 2;
            const pos = this._container.position;
            if (this.$direction == LIST_DIRCTION.HORIZONTAL) {
                this._container.setPosition(pos.x + speedX, pos.y);
            } else {
                this._container.setPosition(pos.x, pos.y + speedY);
            }
        }
    }
}
