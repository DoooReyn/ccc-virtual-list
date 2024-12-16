import {
    _decorator,
    Component,
    Node,
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
    Rect,
    EventMouse,
    Event,
    misc,
} from "cc";
import ReusableObjectPool, { ReusableObject } from "./ReusableObjectPool";
const { ccclass, property } = _decorator;

/** 虚拟子项的索引标识 */
const VIRTUAL_ID_TAG = Symbol("$vid");

/** 列表滚动方向 */
export const LIST_DIRCTION = Enum({
    /** 水平 */
    HORIZONTAL: 0,
    /** 垂直 */
    VERTICAL: 1,
});

/** 列表布局方式 */
export const LIST_LAYOUT = Enum({
    /** 单个 */
    SINGLE: 0,
    /** 网格 */
    GRID: 1,
});

/** 虚拟子项 */
class VirtualItem extends ReusableObject {
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
    /** 是否显示 */
    public s: boolean = false;
    /** 虚拟列表 */
    public list: VList = null;
    /** 矩形边界 */
    private _rect: Rect = new Rect();
    /**
     * 检查边界
     * @param bounds 容器边界
     */
    public checkBounds(bounds: Rect) {
        this._rect.set(this.x + this.list.container.position.x, this.y + this.list.container.position.y, this.w, this.h);
        const intersects = this._rect.intersects(bounds);
        intersects ? this.onShow() : this.onHide();
        // return intersects;
    }
    public get position() {
        if (this.list.horizontal) {
            return new Vec3(this.x + this.w / 2, this.y, 0);
        } else {
            return new Vec3(this.x, this.y + this.h / 2, 0);
        }
    }
    protected onShow() {
        if (!this.s) {
            this.s = true;
        }
        // @ts-ignore
        this.list.onItemShow(this);
    }
    protected onHide() {
        this.s = false;
        // @ts-ignore
        this.list.onItemHide(this);
    }
    protected reset() {
        this.i = this.w = this.h = this.x = this.y = 0;
        this.s = false;
        this.list = null;
    }
    protected onAcquire(): void {
        this.reset();
    }
    protected onRecycle() {
        this.reset();
    }
    protected onDestroy(): void {
        this.reset();
    }
}

/**
 * 虚拟列表
 */
@ccclass("VList")
export abstract class VList extends Component {
    public static readonly VirtualPool: ReusableObjectPool = new ReusableObjectPool();

    /** 容器最小宽度 */
    private _minWidth: number = 0;
    /** 容器最小高度 */
    private _minHeight: number = 0;
    /** 正在滚动中 */
    private _scrolling: boolean = false;
    /** 正在滚动动画中 */
    private _animating: boolean = false;
    /** 滚动时间（仅用于计算） */
    private _scrollDelta: number = 0;
    /** 滚动距离（仅用于计算） */
    private _scrollOffset: Vec2 = new Vec2();
    /** 容器起始位置 */
    private _startPos: Vec3 = null;
    /** 是否需要刷新滚动状态 */
    private _scrollDirty: boolean = false;
    /** 触摸落下计时点 */
    private _dropAt: number = 0;
    /** 触摸松开计时点 */
    private _leaveAt: number = 0;
    /** 上次记录的容器位置 */
    private _lastPos: Vec2 = new Vec2();
    /** 触摸落下位置 */
    private _dropPos: Vec2 = new Vec2();
    /** 触摸松开位置 */
    private _leavePos: Vec2 = new Vec2();
    /** 虚拟子项列表 */
    protected _vitems: VirtualItem[] = [];
    /** 容器节点 */
    protected _container: Node = null;
    /** 容器变化组件 */
    protected _containerTransform: UITransform = null;
    /** 数据源 */
    protected _dataSource: any[] | null;
    /** 固定滚到底部 */
    protected _stickDirty: boolean = false;

    @property({ displayName: "调试绘制", displayOrder: 0 })
    protected $debugDraw: boolean = false;
    @property({ displayName: "滚动方向", type: LIST_DIRCTION, group: { id: "1", name: "基础参数", displayOrder: 1 } })
    protected $direction = LIST_DIRCTION.VERTICAL;
    @property({ displayName: "布局方式", type: LIST_LAYOUT, group: { id: "1", name: "基础参数", displayOrder: 1 } })
    protected $layout = LIST_LAYOUT.SINGLE;
    @property({ displayName: "子项间距", type: CCInteger, group: { id: "1", name: "基础参数", displayOrder: 1 } })
    protected $spacing = 0;
    @property({
        displayName: "自动滚到底部",
        tooltip: "在聊天列表中非常有用",
        group: { id: "1", name: "基础参数", displayOrder: 1 },
    })
    protected $stickAtEnd: boolean = false;
    @property({ displayName: "左", type: CCInteger, group: { id: "2", name: "边距", displayOrder: 2 } })
    protected $paddingLeft = 0;
    @property({ displayName: "右", type: CCInteger, group: { id: "2", name: "边距", displayOrder: 2 } })
    protected $paddingRight = 0;
    @property({ displayName: "上", type: CCInteger, group: { id: "2", name: "边距", displayOrder: 2 } })
    protected $paddingTop = 0;
    @property({ displayName: "下", type: CCInteger, group: { id: "2", name: "边距", displayOrder: 2 } })
    protected $paddingBottom = 0;
    @property({ displayName: "滚动开关", group: { id: "3", name: "惯性", displayOrder: 3 } })
    protected $inertia = false;
    @property({ displayName: "滚动倍速", group: { id: "3", name: "惯性", displayOrder: 3 } })
    protected $speed = 1;
    @property({ displayName: "滚动阈值（毫秒）", group: { id: "3", name: "惯性", displayOrder: 3 } })
    protected $scrollDelta = 300;
    @property({ displayName: "滚动阈值（像素）", group: { id: "3", name: "惯性", displayOrder: 3 } })
    protected $scrollSpan = 60;
    @property({ displayName: "回弹开关", group: { id: "4", name: "回弹", displayOrder: 4 } })
    protected $bouncable = true;
    @property({ displayName: "回弹时间", group: { id: "4", name: "回弹", displayOrder: 4 } })
    protected $bounceTime = 0.1;

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

        if (this.$debugDraw) {
            containerN.addComponent(Graphics);
        }
    }

    protected onEnable(): void {
        this.view.on(Node.EventType.TOUCH_START, this.onTouchDrop, this, true);
        this.view.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
        this.view.on(Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this, true);
        this.view.on(Node.EventType.TOUCH_END, this.onTouchLeave, this, true);
        this.view.on(Node.EventType.TOUCH_CANCEL, this.onTouchLeave, this, true);
        this.schedule(this.checkSticky, 0.1);
    }

    protected onDisable(): void {
        this.unschedule(this.checkSticky);
        this.view.off(Node.EventType.TOUCH_START, this.onTouchDrop, this, true);
        this.view.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
        this.view.off(Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this, true);
        this.view.off(Node.EventType.TOUCH_END, this.onTouchLeave, this, true);
        this.view.off(Node.EventType.TOUCH_CANCEL, this.onTouchLeave, this, true);
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
            item.getComponent(UITransform).setContentSize(...this.preGetItemSize(vitem.i));
            item.active = true;
            this.renderItem(item, vitem.i);
        }
    }

    /**
     * 虚拟子项移出视野
     * @param vitem 虚拟子项
     */
    protected onItemHide(vitem: VirtualItem) {
        const item = this.getItemAt(vitem.i, false);
        if (item) {
            this.recycleItem(item);
        }
    }

    /** 绘制容器边界 */
    private drawContainerBounds() {
        if (this.$debugDraw) {
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
     * 获取子项的索引
     * @param item 子项
     * @returns
     */
    public getItemIndex(item: Node) {
        return item[VIRTUAL_ID_TAG] ?? -1;
    }

    /**
     * 如果目标是自身则停止传递事件
     * @param event 事件
     */
    protected stopPropagationIfTargetIsMe(event: Event): void {
        if (event.eventPhase === Event.AT_TARGET && event.target === this.node) {
            event.propagationStopped = true;
        }
    }

    /**
     * 落下
     * @param e 触摸事件
     */
    private onTouchDrop(e: EventTouch) {
        this._dropAt = Date.now();
        this._dropPos.x = e.getLocationX();
        this._dropPos.y = e.getLocationY();
        this._lastPos.x = this._container.position.x;
        this._lastPos.y = this._container.position.y;
        this.stopPropagationIfTargetIsMe(e);
    }

    /**
     * 拖拽
     * @param e 触摸事件
     */
    private onTouchMove(e: EventTouch) {
        this.stopScroll();
        const delta = e.getDelta().multiplyScalar(0.85);
        if (delta.length() != 0) {
            if (this.horizontal) {
                this._lastPos.x += delta.x;
                this._container.setPosition(this._container.position.x + delta.x, this._container.position.y);
            } else {
                this._lastPos.y += delta.y;
                this._container.setPosition(this._container.position.x, this._container.position.y + delta.y);
            }
            this._scrollDirty = true;
            this.unschedule(this.checkBounce);
            this.scheduleOnce(this.checkBounce, 0.5);
        }
        this.stopPropagationIfTargetIsMe(e);
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
            this._scrollDirty = true;
            this.updateBounds();
        }
        this.stopPropagationIfTargetIsMe(e);
    }

    /**
     * 松开
     * @param e 触摸事件
     */
    private onTouchLeave(e: EventTouch) {
        if (this.checkBounce()) return;
        if (this.$inertia) {
            this._leaveAt = Date.now();
            this._leavePos.x = e.getLocationX();
            this._leavePos.y = e.getLocationY();
            const delta = this._leaveAt - this._dropAt;
            if (this.horizontal && Math.abs(this._leavePos.x - this._dropPos.x) < this.$scrollSpan) return;
            if (this.vertical && Math.abs(this._leavePos.y - this._dropPos.y) < this.$scrollSpan) return;
            if (delta > this.$scrollDelta) return;
            this._scrolling = true;
            this._scrollDelta = delta / 1000;
            this._scrollOffset.x = this._leavePos.x - this._dropPos.x;
            this._scrollOffset.y = this._leavePos.y - this._dropPos.y;
        }
        this.stopPropagationIfTargetIsMe(e);
    }

    /**
     * 容器尺寸
     */
    public get contentSize() {
        return this._containerTransform.contentSize;
    }

    /** 自动回弹时间 */
    private get bouncableTime() {
        return this.$bouncable ? this.$bounceTime : 0;
    }

    /**
     * 检查回弹
     * @return
     */
    private checkBounce() {
        if (this.horizontal) {
            if (this._container.position.x > this._startPos.x) {
                this.scrollToStart(this.bouncableTime);
                return true;
            } else if (this._container.position.x < -this._containerTransform.width + this.minWidth / 2) {
                this.scrollToEnd(this.bouncableTime);
                return true;
            }
        } else {
            if (this._container.position.y < this._startPos.y) {
                this.scrollToStart(this.bouncableTime);
                return true;
            } else if (this._container.position.y > this._containerTransform.height - this.minHeight / 2) {
                this.scrollToEnd(this.bouncableTime);
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

    /** 刷新列表 */
    private refreshView() {
        const rc = this._vitems.length;
        const dc = this._dataSource.length;
        const count = rc - dc;
        if (count > 0) {
            // 清理虚拟子项【虚拟子项多了】
            for (let i = rc - 1; i >= dc; i--) {
                this.recycleVirtualItem(i);
            }
        } else if (count < 0) {
            // 增加虚拟子项【虚拟子项不足】
            for (let i = 0; i < -count; i++) {
                this.acquireVirtualItem(i + rc);
            }
        }
        // 重置虚拟子项
        this.rebuildVirtualItems();
    }

    protected acquireVirtualItem(index: number) {
        const [w, h] = this.preGetItemSize(index);
        const vitem = VList.VirtualPool.acqruire<VirtualItem>(VirtualItem);
        vitem.list = this;
        vitem.w = w;
        vitem.h = h;
        vitem.i = index;
        vitem.s = false;
        this._vitems.push(vitem);
    }

    protected recycleVirtualItem(index: number) {
        const vitem = this._vitems[index];
        if (vitem) {
            const ritem = this.getItemAt(index, false);
            if (ritem) this.recycleItem(ritem);
            this._vitems.splice(index, 1);
            VList.VirtualPool.recycle(vitem);
        }
    }

    protected rebuildVirtualItems() {
        const hor = this.horizontal;
        let startX: number = 0;
        let startY: number = 0;
        if (this._dataSource && this._dataSource.length > 0) {
            let item: VirtualItem;
            for (let i = 0; i < this._dataSource.length; i++) {
                item = this._vitems[i];
                item.i = i;
                if (hor) {
                    item.x = startX + this.$spacing;
                    item.y = 0;
                    startX += item.w;
                } else {
                    startY -= this.$spacing;
                    startY -= item.h;
                    item.x = 0;
                    item.y = startY;
                }
                item.w = item.w;
                item.h = item.h;
            }
        }
        const size = this.calculateSize();
        this._containerTransform.setContentSize(size);
        this.drawContainerBounds();
        if (this.atStart()) {
            this._container.setPosition(this.getStartPos());
            misc.callInNextTick(() => this.scrollToStart(this.bouncableTime));
        } else if (this.atEnd()) {
            this._container.setPosition(this.getEndPos());
            misc.callInNextTick(() => this.scrollToEnd(this.bouncableTime));
        } else {
            this.checkVirtualBounds();
        }
    }

    public getStartPos() {
        return new Vec3(this._startPos);
    }

    public getEndPos() {
        const size = this.contentSize;
        if (this.horizontal) {
            return new Vec3(-size.width + this._minWidth / 2 + this.$spacing / 2, this._startPos.y);
        } else {
            return new Vec3(this._startPos.x, size.height - this.minHeight / 2 - this.$spacing / 2);
        }
    }

    /**
     * 设置数据源
     * @param data 数据源
     */
    public set data(data: any[]) {
        this._dataSource = data;
        this._stickDirty = true;
        this.refreshView();
    }

    /**
     * 清空数据源
     */
    public clear() {
        const count = this._dataSource.length;
        for (let i = count - 1; i >= 0; i--) {
            this.recycleVirtualItem(i);
        }
        this._vitems.length = 0;
        if (this._dataSource) this._dataSource.length = 0;
        this._containerTransform.setContentSize(this.calculateSize());
        this.drawContainerBounds();
        this.scrollToStart();
    }

    /**
     * 子项数量
     */
    public get count() {
        return this._dataSource ? this._dataSource.length : 0;
    }

    protected preGetItemSize(index: number): [number, number] {
        if (this._vitems[index]) {
            return [this._vitems[index].w, this._vitems[index].h];
        } else {
            return this.getItemSize(index);
        }
    }

    protected updateItemSize(index: number, width: number, height: number) {
        if (this._vitems[index]) {
            this._vitems[index].w = width;
            this._vitems[index].h = height;
            this.rebuildVirtualItems();
        }
    }

    protected updateItemWidth(index: number, width: number) {
        if (this._vitems[index]) {
            this._vitems[index].w = width;
            this.rebuildVirtualItems();
        }
    }

    protected updateItemHeight(index: number, height: number) {
        if (this._vitems[index] && this._vitems[index].h != height) {
            this._vitems[index].h = height;
            this.rebuildVirtualItems();
        }
    }

    /**
     * 获取子项尺寸
     * @param index 索引
     * @returns
     */
    protected abstract getItemSize(index: number): [number, number];

    /** 添加视图子项 */
    protected abstract appendItem(index: number): Node;

    protected abstract renderItem(item: Node, index: number): void;

    /** 回收视图子项 */
    protected abstract recycleItem(item: Node): void;

    /**
     * 获取指定索引处的子项
     * @param index 索引
     * @returns
     */
    public getItemAt(index: number, force: boolean = false): Node | null {
        const name = `item_${index}`;
        const container = this._container;
        let item = container.getChildByName(name);
        if (!item && force) {
            item = this.appendItem(index);
            item[VIRTUAL_ID_TAG] = index;
            container.addChild(item);
        }
        if (item) {
            item.name = name;
        }
        return item;
    }

    /** 移除第一项 */
    public removeStart() {
        this.removeAt(0);
    }

    /** 移除最后一项 */
    public removeEnd() {
        this.removeAt(this.count - 1);
    }

    /**
     * 移除指定索引处的子项
     * @param index 索引
     */
    public removeAt(index: number) {
        if (this._dataSource && index >= 0 && index < this._dataSource.length) {
            this._dataSource.splice(index, 1);
            this.data = this._dataSource;
        }
    }

    /**
     * 移除指定范围内的子项
     * @param start 开始索引
     * @param count 移除数量
     */
    public removeRange(start: number, count: number) {
        if (this._dataSource && start >= 0 && start < this._dataSource.length && count > 0) {
            this._dataSource.splice(start, count);
            this.data = this._dataSource;
        }
    }

    /**
     * 插入数据项
     * @param index 索引
     * @param item 数据项
     */
    public insertAt(index: number, item: any) {
        if (this._dataSource) {
            if (index < 0) {
                index = 0;
            } else if (index > this._dataSource.length) {
                index = this._dataSource.length;
            }
            this._dataSource.splice(index, 0, item);
            this.data = this._dataSource;
        }
    }

    /**
     * 插入数据项到开头
     * @param item 数据项
     */
    public insertStart(item: any) {
        this.insertAt(0, item);
    }

    /**
     * 插入数据项到末尾
     * @param item 数据项
     */
    public insertEnd(item: any) {
        this.insertAt(this.count, item);
    }

    /**
     * 从指定索引处开始，插入数据项数组
     * @param start 开始索引
     * @param items 数据项数组
     */
    public insertRange(start: number, items: any[]) {
        if (this._dataSource && items.length > 0) {
            if (start < 0) {
                start = 0;
            } else if (start >= this._dataSource.length) {
                start = this._dataSource.length - 1;
            }
            this._dataSource.splice(start, 0, ...items);
            this.data = this._dataSource;
        }
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
            size = this.preGetItemSize(i);
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

    public atStart() {
        if (this.horizontal) {
            return this._container.position.x >= this._startPos.x + this.$spacing / 2;
        } else {
            return this.container.position.y <= this._startPos.y + this.$spacing / 2;
        }
    }

    public atEnd() {
        if (this.horizontal) {
            return this._container.position.x <= -this.contentSize.width + this.minWidth / 2 + this.$spacing / 2;
        } else {
            return this.container.position.y >= this.contentSize.height - this._minHeight / 2 - this.$spacing / 2;
        }
    }

    /** 停止滚动 */
    public stopScroll() {
        Tween.stopAllByTarget(this._container);
        this._scrolling = false;
        this._scrollDelta = 0;
        this._animating = false;
        this._scrollOffset.set(0, 0);
    }

    /**
     * 滚动到指定位置
     * @param position 目标位置
     * @param delta 动画时间
     */
    public scrollTo(position: Vec3, delta: number = 0) {
        this.stopScroll();
        this._animating = true;
        tween(this._container)
            .to(delta, { position: position })
            .call(() => {
                this._animating = false;
                this.updateBounds();
            }, this)
            .start();
    }

    /** 是否正在滚动动画中 */
    public get animating() {
        return this._animating;
    }

    /** 更新边界与回弹 */
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
        if (index == 0) {
            this.scrollTo(this._startPos, delta);
            return;
        }
        const vitem = this._vitems[index];
        if (vitem) {
            const pos = vitem.position;
            if (this.horizontal) {
                pos.x = -pos.x - this._minWidth / 2 + this.$spacing / 2 + vitem.w / 2;
                pos.x = Math.max(pos.x, -this.contentSize.width + this.minWidth / 2 + this.$spacing / 2);
            } else {
                pos.y = -pos.y - vitem.h / 2 - this.$spacing / 2 + this._minHeight / 2;
                pos.y = Math.min(pos.y, this.contentSize.height - this._minHeight / 2 - this.$spacing / 2);
            }
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
            this._scrollDirty = true;
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
        if (this._animating || this._scrollDirty) {
            if (this._scrollDirty) this._scrollDirty = false;
            this.checkVirtualBounds();
        }
    }

    private checkSticky() {
        if (this.$stickAtEnd && this._stickDirty && !this._animating) {
            const atEnd = this.atEnd();
            if (atEnd) {
                this._stickDirty = false;
            } else {
                this.scrollToEnd(this.$bounceTime);
            }
        }
    }
}

VList.VirtualPool.add(VirtualItem);
