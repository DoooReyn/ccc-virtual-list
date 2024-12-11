import {
    _decorator,
    Component,
    Node,
    Prefab,
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
const AUTO_ANIMATE_DELTA = 0.03;
const SCROLL_DELTA = 200; // 滚动阈值
let DROP_AT = 0;
let LEAVE_AT = 0;

@ccclass("VList")
export class VList extends Component {
    private _container: Node = null;
    private _containerTransform: UITransform = null;
    private _minWidth: number = 0;
    private _minHeight: number = 0;
    private _dataSource: any[] | null;
    private _startPos: Vec3 = null;

    @property({ displayName: "左", type: CCInteger, group: { name: "边距", displayOrder: 1 } })
    protected $paddingLeft = 0;
    @property({ displayName: "右", type: CCInteger, group: { name: "边距", displayOrder: 2 } })
    protected $paddingRight = 0;
    @property({ displayName: "上", type: CCInteger, group: { name: "边距", displayOrder: 3 } })
    protected $paddingTop = 0;
    @property({ displayName: "下", type: CCInteger, group: { name: "边距", displayOrder: 4 } })
    protected $paddingBottom = 0;
    @property({ displayName: "滚动方向", type: LIST_DIRCTION })
    protected $direction = LIST_DIRCTION.VERTICAL;

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
        maskC.enabled = false;

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
            const pos = this.$direction == LIST_DIRCTION.HORIZONTAL ? new Vec3(0, -mh / 2) : new Vec3(-mw / 2, -mh);
            const containerG = containerN.addComponent(Graphics);
            containerG.lineWidth = 2;
            containerG.strokeColor = new Color(0, 255, 0);
            containerG.fillColor = new Color(0, 0, 0, 50);
            containerG.fillRect(pos.x, pos.y, mw, mh);
            containerG.stroke();

            const template = this.node.parent.getChildByName("Item");
            const item = instantiate(template);
            item.active = true;
            containerN.addChild(item);

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
    }

    private onTouchDrop(e: EventTouch) {
        console.log("==drop==");
        DROP_AT = Date.now();
        DROP_POS.x = e.getLocationX();
        DROP_POS.y = e.getLocationY();
        LAST_POS.x = this._container.position.x;
        LAST_POS.y = this._container.position.y;
    }

    private onTouchMove(e: EventTouch) {
        console.log("==move==");
        const delta = e.getDelta();
        if (this.$direction == LIST_DIRCTION.HORIZONTAL) {
            LAST_POS.x += delta.x;
            this._container.setPosition(this._container.position.x + delta.x, this._container.position.y);
        } else {
            LAST_POS.y += delta.y;
            this._container.setPosition(this._container.position.x, this._container.position.y + delta.y);
        }
    }

    private onTouchLeave(e: EventTouch) {
        console.log("==leave==", this._container.position.toString());
        if (this.$direction == LIST_DIRCTION.HORIZONTAL) {
            if (this._container.position.x <= this._startPos.x) {
                this.scrollTo(this._startPos, AUTO_ANIMATE_DELTA);
                return;
            } else if (this._container.position.x >= this._containerTransform.width - this.minWidth * 1.5) {
                const pos = new Vec3(this._containerTransform.width - this.minWidth * 1.5, this._container.position.y);
                this.scrollTo(pos, AUTO_ANIMATE_DELTA);
                return;
            }
        } else {
            if (this._container.position.y >= this._startPos.y) {
                this.scrollTo(this._startPos, AUTO_ANIMATE_DELTA);
                return;
            } else if (this._container.position.y <= this._containerTransform.height - this.minHeight / 2) {
                const pos = new Vec3(this._container.position.x, this._containerTransform.height - this.minHeight / 2);
                this.scrollTo(pos, AUTO_ANIMATE_DELTA);
                return;
            }
        }

        LEAVE_AT = Date.now();
        LEAVE_POS.x = e.getLocationX();
        LEAVE_POS.y = e.getLocationY();
        const span = LEAVE_AT - DROP_AT;
        if (span < SCROLL_DELTA) {
            // 动画
        } else {
            // 滚动
        }
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
        return [0, 0];
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
    private removeSpan(start: number, end: number) {
        // @todo
    }

    /** 停止滚动 */
    public stopScroll() {
        Tween.stopAllByTarget(this._container);
    }

    /**
     * 滚动到指定位置
     * @param position 目标位置
     * @param delta 动画时间
     */
    public scrollTo(position: Vec3, delta: number = 0) {
        Tween.stopAllByTarget(this._container);
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
}
