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
    Rect,
    EventMouse,
} from "cc";
import VItem from "./VItem";
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
    /** 虚拟列表 */
    public list: VList = null;
    private _rect: Rect = new Rect();
    /**
     * 检查边界
     * @param bounds 容器边界
     */
    public checkBounds(bounds: Rect) {
        this._rect.set(this.x + this.list.container.position.x, this.y + this.list.container.position.y, this.w, this.h);
        const intersects = this._rect.intersects(bounds);
        intersects ? this.onShow() : this.onHide();
        return intersects;
    }
    protected onShow() {
        // @ts-ignore
        this.list.onItemShow(this);
    }
    protected onHide() {
        // @ts-ignore
        this.list.onItemHide(this);
    }
    protected onRecycle() {
        this.i = this.w = this.h = this.x = this.y = 0;
        this.list = null;
    }
    public get position() {
        if (this.list.horizontal) {
            return new Vec3(this.x + this.w / 2, this.y, 0);
        } else {
            return new Vec3(this.x, this.y + this.h / 2, 0);
        }
    }
}

class VirtualItemFactory {
    private static _inst: VirtualItemFactory = null;
    public static get inst() {
        return (this._inst ??= new VirtualItemFactory());
    }
    private _pool: VirtualItem[] = [];
    public get(): VirtualItem {
        if (this._pool.length > 0) {
            return this._pool.pop();
        }
        return new VirtualItem();
    }
    public put(item: VirtualItem) {
        this._pool.push(item);
    }
}

class RealItemFactory {
    private _template: Node;
    private _pool: Node[] = [];
    public set template(t: Node) {
        this._template = t;
    }
    public get(): Node {
        if (this._pool.length > 0) {
            return this._pool.pop();
        }
        return instantiate(this._template);
    }
    public put(item: Node) {
        item.removeFromParent();
        this._pool.push(item);
    }
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
    private _dirty: boolean = false;
    protected _itemPool: RealItemFactory = new RealItemFactory();

    @property({ displayName: "滚动方向", type: LIST_DIRCTION, group: { id: "1", name: "基础参数", displayOrder: 1 } })
    protected $direction = LIST_DIRCTION.VERTICAL;
    @property({ displayName: "布局方式", type: LIST_LAYOUT, group: { id: "1", name: "基础参数", displayOrder: 2 } })
    protected $layout = LIST_LAYOUT.SINGLE_LINE;
    @property({ displayName: "子项间距", type: CCInteger, group: { id: "1", name: "基础参数", displayOrder: 3 } })
    protected $spacing = 0;
    @property({ displayName: "滚动开关", group: { id: "2", name: "惯性", displayOrder: 1 } })
    protected $inertia = false;
    @property({ displayName: "滚动倍速", group: { id: "2", name: "惯性", displayOrder: 2 } })
    protected $speed = 1;
    @property({ displayName: "左", type: CCInteger, group: { id: "3", name: "边距", displayOrder: 1 } })
    protected $paddingLeft = 0;
    @property({ displayName: "右", type: CCInteger, group: { id: "3", name: "边距", displayOrder: 2 } })
    protected $paddingRight = 0;
    @property({ displayName: "上", type: CCInteger, group: { id: "3", name: "边距", displayOrder: 3 } })
    protected $paddingTop = 0;
    @property({ displayName: "下", type: CCInteger, group: { id: "3", name: "边距", displayOrder: 4 } })
    protected $paddingBottom = 0;

    protected onLoad(): void {
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
        const anchor = this.horizontal ? new Vec2(0, 0.5) : new Vec2(0.5, 1);
        const pos = this.horizontal ? new Vec3(-mw / 2, 0) : new Vec3(0, mh / 2);
        containerC.setContentSize(mw, mh);
        containerC.setAnchorPoint(anchor);
        maskN.addChild(containerN);
        this._containerTransform = containerC;
        this._container = containerN;
        containerN.setPosition(pos);
        this._startPos = pos.clone();

        if (__TEST__) {
            containerN.addComponent(Graphics);
            (<any>window).vlist = this;
        }

        // 对象池
        if (this.horizontal) {
            const template = this.node.parent.getChildByName("HItem");
            this._itemPool.template = template;
        } else {
            const template = this.node.parent.getChildByName("VItem");
            this._itemPool.template = template;
        }
    }

    protected onEnable(): void {
        this.view.on(Node.EventType.TOUCH_START, this.onTouchDrop, this, true);
        this.view.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
        this.view.on(Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this, true);
        this.view.on(Node.EventType.TOUCH_END, this.onTouchLeave, this, true);
        this.view.on(Node.EventType.TOUCH_CANCEL, this.onTouchLeave, this, true);
    }

    protected onDisable(): void {
        this.view.off(Node.EventType.TOUCH_START, this.onTouchDrop, this, true);
        this.view.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
        this.view.off(Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this, true);
        this.view.off(Node.EventType.TOUCH_END, this.onTouchLeave, this, true);
        this.view.off(Node.EventType.TOUCH_CANCEL, this.onTouchLeave, this, true);
    }

    protected start(): void {
        if (__TEST__) {
            this.data = new Array(100).fill(0).map((_, i) => i + 1);
        }
    }

    /** 是否水平滚动 */
    public get horizontal() {
        return this.$direction == LIST_DIRCTION.HORIZONTAL;
    }

    /** 是否垂直滚动 */
    public get vertical() {
        return this.$direction == LIST_DIRCTION.VERTICAL;
    }

    /** 视图边界 */
    protected get viewBounds() {
        return this.node._uiProps.uiTransformComp.getBoundingBox();
    }

    /**
     * 虚拟子项进入视野
     * @param vitem 虚拟子项
     */
    protected onItemShow(vitem: VirtualItem) {
        const item = this.getItemAt(vitem.i, true);
        if (item) {
            item.setPosition(vitem.position);
        }
    }

    /**
     * 虚拟子项移出视野
     * @param vitem 虚拟子项
     */
    protected onItemHide(vitem: VirtualItem) {
        const item = this.getItemAt(vitem.i, false);
        if (item) {
            this._itemPool.put(item);
        }
    }

    /** 添加实体子项 */
    private appendRealItem() {
        const item = this._itemPool.get();
        item.active = true;
        this._container.addChild(item);
        return item;
    }

    /** 绘制容器边界 */
    private drawContainerBounds() {
        if (__TEST__) {
            const { width, height } = this._containerTransform.contentSize;
            const pos = this.horizontal ? new Vec3(0, -width / 2) : new Vec3(-width / 2, -height);
            const containerG = this._container.getComponent(Graphics);
            containerG.clear();
            containerG.lineWidth = 2;
            containerG.strokeColor = new Color(255, 0, 255);
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
        __TEST__ && console.log("==drop==");
        DROP_AT = Date.now();
        DROP_POS.x = e.getLocationX();
        DROP_POS.y = e.getLocationY();
        LAST_POS.x = this._container.position.x;
        LAST_POS.y = this._container.position.y;
    }

    /**
     * 拖拽
     * @param e 触摸事件
     */
    private onTouchMove(e: EventTouch) {
        __TEST__ && console.log("==move==");
        this.stopScroll();
        const delta = e.getDelta().multiplyScalar(0.85);
        if (delta.length() != 0) {
            if (this.horizontal) {
                LAST_POS.x += delta.x;
                this._container.setPosition(this._container.position.x + delta.x, this._container.position.y);
            } else {
                LAST_POS.y += delta.y;
                this._container.setPosition(this._container.position.x, this._container.position.y + delta.y);
            }
            this._dirty = true;
        }
    }

    /**
     * 鼠标滚轮滚动
     * @param e 滚轮事件
     */
    private onMouseWheel(e: EventMouse) {
        this.stopScroll();
        const delta = e.getScrollY() * -0.1;
        if (delta != 0) {
            if (this.horizontal) {
                this._container.setPosition(this._container.position.x + delta, this._container.position.y);
            } else {
                this._container.setPosition(this._container.position.x, this._container.position.y + delta);
            }
            this._dirty = true;
            this.updateBounds();
        }
    }

    /**
     * 松开
     * @param e 触摸事件
     */
    private onTouchLeave(e: EventTouch) {
        __TEST__ && console.log("==leave==");
        if (this.checkBounce()) return;
        if (this.$inertia) {
            LEAVE_AT = Date.now();
            LEAVE_POS.x = e.getLocationX();
            LEAVE_POS.y = e.getLocationY();
            const delta = LEAVE_AT - DROP_AT;
            if (this.horizontal && Math.abs(LEAVE_POS.x - DROP_POS.x) < SCROLL_SPAN) return;
            if (this.vertical && Math.abs(LEAVE_POS.y - DROP_POS.y) < SCROLL_SPAN) return;
            if (delta > SCROLL_DELTA) return;
            this._scrolling = true;
            this._scrollDelta = delta / 1000;
            this._scrollOffset.x = LEAVE_POS.x - DROP_POS.x;
            this._scrollOffset.y = LEAVE_POS.y - DROP_POS.y;
        }
    }

    /**
     * 容器尺寸
     */
    public get contentSize() {
        return this._containerTransform.contentSize;
    }

    /**
     * 检查回弹
     * @return
     */
    private checkBounce() {
        if (this.horizontal) {
            if (this._container.position.x > this._startPos.x) {
                this.scrollToStart(AUTO_ANIMATE_DELTA);
                return true;
            } else if (this._container.position.x < -this._containerTransform.width + this.minWidth / 2) {
                this.scrollToEnd(AUTO_ANIMATE_DELTA);
                return true;
            }
        } else {
            if (this._container.position.y < this._startPos.y) {
                this.scrollToStart(AUTO_ANIMATE_DELTA);
                return true;
            } else if (this._container.position.y > this._containerTransform.height - this.minHeight / 2) {
                this.scrollToEnd(AUTO_ANIMATE_DELTA);
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
        // 更新数据源
        this._dataSource = data;

        // 清理虚拟子项
        for (let i = 0, ritem: Node; i < this._vitems.length; i++) {
            ritem = this.getItemAt(i, false);
            if (ritem) this._itemPool.put(ritem);
            VirtualItemFactory.inst.put(this._vitems[i]);
        }
        this._vitems.length = 0;

        // 添加虚拟子项
        const hor = this.horizontal;
        if (data && data.length > 0) {
            let item: VirtualItem;
            let bounds = this.viewBounds;
            for (let i = 0; i < this._dataSource.length; i++) {
                const [width, height] = this.getItemSize(i);
                item = VirtualItemFactory.inst.get();
                item.list = this;
                item.i = i;
                item.x = hor ? (width + this.$spacing) * (i + 1) - width : 0;
                item.y = hor ? 0 : -(height + this.$spacing) * (i + 1);
                item.w = width;
                item.h = height;
                item.checkBounds(bounds);
                this._vitems.push(item);
            }
        }

        // 更新容器
        this._containerTransform.setContentSize(this.calculateSize());
        this._container.setPosition(this._startPos);
        this.drawContainerBounds();
        this.checkVirtualBounds();
    }

    /**
     * 清空数据源
     */
    public clear() {
        const count = this._dataSource.length;
        for (let i = count - 1, ritem: Node; i >= 0; i--) {
            ritem = this.getItemAt(i, false);
            if (ritem) {
                this._itemPool.put(ritem);
            }
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
        if (this.horizontal) {
            return [180, 120];
        } else {
            return [1024, 120];
        }
    }

    private onItemClicked(e: any) {
        console.log(e);
    }

    /**
     * 获取指定索引处的子项
     * @param index 索引
     * @returns
     */
    public getItemAt(index: number, force: boolean = false): Node | null {
        const name = `item_${index}`;
        let item = this._container.getChildByName(name);
        if (!item && force) {
            item = this.appendRealItem();
            item.getChildByName("Label").getComponent(Label).string = (index + 1).toString();
            item.on("click", this.onItemClicked, this);
        }
        if (item) {
            item.name = name;
            // const height = this.getItemSize(index)[1];
            // item.setPosition(0, -height / 2 - height * index - this.$spacing * (index + 1));
        }
        return item;
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
        let hor = this.horizontal;
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
        tween(this._container)
            .to(delta, { position: position }, { onUpdate: () => this.checkVirtualBounds() })
            .call(this.updateBounds, this)
            .start();
    }

    /**
     * 更新边界与回弹
     */
    private updateBounds() {
        this.checkBounce();
        this.checkVirtualBounds();
    }

    /**
     * 滚动到指定索引
     * @param index 索引
     * @param delta 动画时间
     */
    public scrollToIndex(index: number, delta: number = 0) {
        const vitem = this._vitems[index];
        if (vitem) {
            const pos = vitem.position.clone();
            if (this.horizontal) {
                pos.x = -pos.x - this._minWidth / 2 + this.$spacing / 2 + vitem.w / 2;
                pos.x = Math.max(pos.x, -this.contentSize.width + this.minWidth / 2 + this.$spacing / 2);
            } else {
                pos.y = -pos.y - vitem.h / 2 - this.$spacing / 2 + this._minHeight / 2;
                pos.y = Math.min(pos.y, this.contentSize.height - this._minHeight / 2 - this.$spacing / 2);
            }
            // @test
            __TEST__ && console.log("==scrollTo==", index, pos.toString());
            this.scrollTo(pos, delta);
        }
    }

    /**
     * 滚动到开始处
     * @param delta 动画时间
     */
    public scrollToStart(delta: number = 0) {
        if (this.horizontal) {
            this.scrollToLeft(delta);
        } else {
            this.scrollToTop(delta);
        }
    }

    /**
     * 滚动到结束处
     * @param delta 动画时间
     */
    public scrollToEnd(delta: number = 0) {
        if (this.horizontal) {
            this.scrollToRight(delta);
        } else {
            this.scrollToBottom(delta);
        }
    }

    /**
     * 滚动到最左侧
     * @param delta 动画时间
     */
    public scrollToLeft(delta: number = 0) {
        if (this.horizontal) {
            this.scrollToIndex(0, delta);
        }
    }

    /**
     * 滚动到最左侧
     * @param delta 动画时间
     */
    public scrollToRight(delta: number = 0) {
        if (this.horizontal) {
            this.scrollToIndex(this.count - 1, delta);
        }
    }

    /**
     * 滚动到最顶侧
     * @param delta 动画时间
     */
    public scrollToTop(delta: number = 0) {
        if (this.vertical) {
            this.scrollToIndex(0, delta);
        }
    }

    /**
     * 滚动到最底侧
     * @param delta 动画时间
     */
    public scrollToBottom(delta: number = 0) {
        if (this.vertical) {
            this.scrollToIndex(this.count - 1, delta);
        }
    }

    /**
     * 检查虚拟子项的边界
     */
    private checkVirtualBounds() {
        const bounds = this.viewBounds;
        for (let i = 0, item: VirtualItem; i < this._vitems.length; i++) {
            item = this._vitems[i];
            item.checkBounds(bounds);
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
            this._dirty = true;
            this._scrollDelta -= dt * 0.1;
            const speedX = this._scrollOffset.x * this._scrollDelta * this.$speed;
            const speedY = this._scrollOffset.y * this._scrollDelta * this.$speed;
            const pos = this._container.position;
            if (this.horizontal) {
                this._container.setPosition(pos.x + speedX, pos.y);
            } else {
                this._container.setPosition(pos.x, pos.y + speedY);
            }
        }
        if (this._dirty) {
            this._dirty = false;
            this.checkVirtualBounds();
        }
    }
}
