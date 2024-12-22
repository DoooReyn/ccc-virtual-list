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
    EventMouse,
    Event,
    misc,
    Rect,
} from "cc";
import VirtualItem from "./VirtualItem";
import { VirtualItemPool } from "./VirtualItemPool";
import ScrollBar from "./ScrollBar";
const { ccclass, property } = _decorator;

/** 虚拟子项的索引标识 */
const VIRTUAL_ID_TAG = Symbol("$vid");

/** 列表滚动方向 */
const LIST_DIRCTION = Enum({
    /** 水平 */
    HORIZONTAL: 0,
    /** 垂直 */
    VERTICAL: 1,
});

/** 列表布局方式 */
const LIST_LAYOUT = Enum({
    /** 单项 */
    SINGLE: 0,
    /** 网格 */
    GRID: 1,
});

/** 列表滚动方式 */
enum LIST_SCROLL_MODE {
    /** 停止滚动 */
    STOP = -1,
    /** 滚到指定位置 */
    POSITION = 0,
    /** 滚到指定索引位置 */
    INDEX,
    /** 滚到起始处 */
    START,
    /** 滚到结束处 */
    END,
}

/**
 * 虚拟列表
 * @abstract
 */
@ccclass("VirtualList")
export abstract class VirtualList extends Component {
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
    protected _stickEndDirty: boolean = false;
    /** 滚动到索引 */
    private _toIndex: number | null = null;
    /** 滚动方式 */
    private _scrollMode: LIST_SCROLL_MODE = LIST_SCROLL_MODE.STOP;
    /** 滚动条 */
    private _scrollBar: ScrollBar = null;

    @property({ displayName: "调试绘制", displayOrder: 0 })
    protected $debugDraw: boolean = false;
    @property({ displayName: "滚动方向", type: LIST_DIRCTION, group: { id: "1", name: "基础参数", displayOrder: 1 } })
    protected $direction = LIST_DIRCTION.VERTICAL;
    @property({ displayName: "布局方式", type: LIST_LAYOUT, group: { id: "1", name: "基础参数", displayOrder: 1 } })
    protected $layout = LIST_LAYOUT.SINGLE;
    @property({ displayName: "子项间距", type: CCInteger, group: { id: "1", name: "基础参数", displayOrder: 1 } })
    protected $spacing = 0;
    @property({ displayName: "自动滚到底部", group: { id: "1", name: "基础参数", displayOrder: 1 } })
    protected $stickAtEnd: boolean = false;
    @property({
        type: Node,
        displayName: "空白提示",
        tooltip: "列表无数据时的提示（可不填）",
        group: { id: "1", name: "基础参数", displayOrder: 1 },
    })
    protected $tipEmpty: Node = null;
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
    @property({ displayName: "网格数量", type: CCInteger, group: { id: "5", name: "网格参数", displayOrder: 5 } })
    protected $grids: number = 1;
    @property({ displayName: "显示滚动条", group: { id: "6", name: "滚动条", displayOrder: 6 } })
    protected $useScrollBar: boolean = false;
    @property({ displayName: "滑块颜色", group: { id: "6", name: "滚动条", displayOrder: 6 } })
    protected $scrollBarColor: Color = new Color(0, 0, 0, 80);
    @property({ displayName: "滑块扁度", type: CCInteger, min: 1, group: { id: "6", name: "滚动条", displayOrder: 6 } })
    protected $scrollBarSpan: number = 3;
    @property({ displayName: "滑块显示时间", group: { id: "6", name: "滚动条", displayOrder: 6 } })
    protected $scrollBarTime: number = 0.5;

    /** 是否水平滚动 */
    public get horizontal() {
        return this.$direction == LIST_DIRCTION.HORIZONTAL;
    }

    /** 是否垂直滚动 */
    public get vertical() {
        return this.$direction == LIST_DIRCTION.VERTICAL;
    }

    /** 实际子项数量 */
    public get realItemCount() {
        return this._container.children.length;
    }

    /** 视图边界 */
    public get viewBounds() {
        // return this.node.getComponent(UITransform).getBoundingBox();
        return new Rect(-this._minWidth / 2, -this._minHeight / 2, this._minWidth, this._minHeight);
    }

    /** 是否单项布局 */
    public get singleLayout() {
        return this.$layout == LIST_LAYOUT.SINGLE;
    }

    /** 是否网格布局 */
    public get gridLayout() {
        return this.$layout == LIST_LAYOUT.GRID;
    }

    /** 一排分成 N 份 */
    public get grids() {
        return this.gridLayout ? this.$grids : 1;
    }

    /** 容器尺寸 */
    public get containerSize() {
        return this._containerTransform.contentSize;
    }

    /** 自动回弹时间 */
    protected get bouncableTime() {
        return this.$bouncable ? this.$bounceTime : 0;
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

    /** 容器起始位置 */
    public get startPos() {
        return new Vec3(this._startPos);
    }

    /** 容器结束位置 */
    public get endPos() {
        const size = this.containerSize;
        if (this.horizontal) {
            return new Vec3(-size.width + this._minWidth / 2, this._startPos.y);
        } else {
            return new Vec3(this._startPos.x, size.height - this.minHeight / 2);
        }
    }

    /** 子项数量 */
    public get count() {
        return this._dataSource ? this._dataSource.length : 0;
    }

    /** 容器是否在起始位置 */
    public get atStart() {
        if (this.horizontal) {
            return this._container.position.x >= this._startPos.x;
        } else {
            return this.container.position.y <= this._startPos.y;
        }
    }

    /** 容器是否在结束位置 */
    public get atEnd() {
        if (this.horizontal) {
            return this._container.position.x <= -this.containerSize.width + this.minWidth / 2;
        } else {
            return this.container.position.y >= this.containerSize.height - this._minHeight / 2;
        }
    }

    /** 是否正在滚动动画中 */
    public get animating() {
        return this._animating;
    }

    /** 是否保持最小尺寸 */
    public get isMinSize() {
        return this.containerSize.width == this._minWidth && this.containerSize.height == this._minHeight;
    }

    /**
     * 获取索引处的数据
     * @param index 索引
     * @returns
     */
    public getDataAt(index: number) {
        if (this._dataSource && index >= 0 && index < this._dataSource.length) {
            return this._dataSource[index];
        }
        return null;
    }

    /**
     * 获取索引处的虚拟子项
     * @param index 索引
     * @returns
     */
    public getVirtualItemAt(index: number) {
        if (this._vitems && index >= 0 && index < this._vitems.length) {
            return this._vitems[index];
        }
        return null;
    }

    /** 可视区尺寸 */
    public get viewSize() {
        return new Size(this._minWidth, this._minHeight);
    }

    /** 外框尺寸 */
    public get frameSize() {
        return this.node.getComponent(UITransform).contentSize;
    }

    /** 容器当前位置 */
    public get containerPos() {
        return this._container.position;
    }

    /** 边距 */
    public get padding() {
        return { l: this.$paddingLeft, r: this.$paddingRight, t: this.$paddingTop, b: this.$paddingBottom };
    }

    /**
     * 设置数据源
     * @param data 数据源
     */
    public set data(data: any[]) {
        this._dataSource = data;
        this._stickEndDirty = true;
        this.checkEmptyTip();
        this.refreshView();
        this.checkEndSticky();
    }

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

        // 滚动条
        if (this.$useScrollBar) {
            this._scrollBar = this.addComponent(ScrollBar);
            this._scrollBar.sliderColor = this.$scrollBarColor;
            this._scrollBar.sliderSpan = this.$scrollBarSpan;
            this._scrollBar.sliderDisplayTime = this.$scrollBarTime;
            this._scrollBar.bind(this);
        }

        // 调试绘制外框
        if (this.$debugDraw) {
            containerN.addComponent(Graphics);
        }
    }

    protected onEnable(): void {
        this.view.on(Node.EventType.TOUCH_START, this.onTouchDrop, this);
        this.view.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.view.on(Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        this.view.on(Node.EventType.TOUCH_END, this.onTouchLeave, this);
        this.view.on(Node.EventType.TOUCH_CANCEL, this.onTouchLeave, this);
        this.checkEmptyTip();
    }

    protected onDisable(): void {
        this.stopScroll();
        this.view.off(Node.EventType.TOUCH_START, this.onTouchDrop, this);
        this.view.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.view.off(Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        this.view.off(Node.EventType.TOUCH_END, this.onTouchLeave, this);
        this.view.off(Node.EventType.TOUCH_CANCEL, this.onTouchLeave, this);
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

    /** 检查列表空白提示 */
    protected checkEmptyTip() {
        if (this.$tipEmpty) {
            this.$tipEmpty.active = this._dataSource && this._dataSource.length == 0;
        }
    }

    /**
     * 虚拟子项进入视野
     * @param vitem 虚拟子项
     */
    public onItemShow(vitem: VirtualItem) {
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
    public onItemHide(vitem: VirtualItem) {
        const item = this.getItemAt(vitem.i, false);
        if (item) this.recycleItem(item);
    }

    /** 绘制容器边界 */
    private drawContainerBounds() {
        if (this.$debugDraw) {
            const { width, height } = this.containerSize;
            const pos = this.horizontal ? new Vec3(0, -height / 2) : new Vec3(-width / 2, -height);
            const containerG = this._container.getComponent(Graphics);
            containerG.clear();
            containerG.lineWidth = 2;
            containerG.strokeColor = new Color(255, 0, 255);
            containerG.fillColor = new Color(0, 0, 0, 25);
            containerG.fillRect(pos.x, pos.y, width, height);
            containerG.stroke();
        }
    }

    /**
     * 获取子项的索引
     * @param item 子项
     * @returns number
     */
    public getItemIndex(item: Node) {
        return item[VIRTUAL_ID_TAG] ?? -1;
    }

    /**
     * 如果目标是自身则停止传递事件
     * @param event 事件
     */
    private stopPropagationIfTargetIsMe(event: Event): void {
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
    }

    /** 检查回弹 */
    private checkBounce() {
        if (this.horizontal) {
            if (this._container.position.x > this.startPos.x) {
                this.scrollToStart(this.bouncableTime);
                return true;
            } else if (this._container.position.x < this.endPos.x) {
                this.scrollToEnd(this.bouncableTime);
                return true;
            }
        } else {
            if (this._container.position.y < this.startPos.y) {
                this.scrollToStart(this.bouncableTime);
                return true;
            } else if (this._container.position.y > this.endPos.y) {
                this.scrollToEnd(this.bouncableTime);
                return true;
            }
        }
        return false;
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
        this.buildVirtualItems();
    }

    /**
     * 创建虚拟子项
     * @param index 索引
     */
    protected acquireVirtualItem(index: number) {
        const [w, h] = this.preGetItemSize(index);
        const vitem = VirtualItemPool.inst.acqruire<VirtualItem>(VirtualItem);
        vitem.l = this;
        vitem.w = w;
        vitem.h = h;
        vitem.i = index;
        this._vitems.push(vitem);
    }

    /**
     * 回收虚拟子项
     * @param index 索引
     */
    protected recycleVirtualItem(index: number) {
        const vitem = this._vitems[index];
        if (vitem) {
            const ritem = this.getItemAt(index, false);
            if (ritem) this.recycleItem(ritem);
            this._vitems.splice(index, 1);
            VirtualItemPool.inst.recycle(vitem);
        }
    }

    /** 构建虚拟子项 */
    protected buildVirtualItems() {
        if (this.singleLayout) {
            this.buildSingleLayout();
        } else {
            this.buildGridLayout();
        }
        this.onVirtualItemBuilt();
        const size = this.calculateSize();
        this._containerTransform.setContentSize(size);
        this.drawContainerBounds();
        if (this.atStart) {
            this._container.setPosition(this.startPos);
        } else if (this.atEnd) {
            this._container.setPosition(this.endPos);
        }
        this.checkVirtualBounds();
    }

    /**
     * 虚拟子项构建完毕
     * @override 子类可以通过复写此方法来处理虚拟子项构建完毕后的逻辑
     */
    protected onVirtualItemBuilt() {}

    /** 构建单项布局 */
    private buildSingleLayout() {
        const hor = this.horizontal;
        let startX: number = 0;
        let startY: number = 0;
        if (this._dataSource && this._dataSource.length > 0) {
            let item: VirtualItem;
            for (let i = 0; i < this._dataSource.length; i++) {
                item = this._vitems[i];
                item.i = i;
                if (item.c && !item.m) {
                    if (hor) {
                        item.x = startX;
                        item.y = 0;
                    } else {
                        item.x = 0;
                        item.y = startY;
                    }
                } else {
                    if (hor) {
                        item.x = startX;
                        item.y = 0;
                        startX += item.w + this.$spacing;
                    } else {
                        startY -= item.h;
                        item.x = 0;
                        item.y = startY;
                        startY -= this.$spacing;
                    }
                }
            }
        }
    }

    /** 构建网格布局 */
    private buildGridLayout() {
        if (this._dataSource && this._dataSource.length > 0) {
            let startX: number = 0;
            let startY: number = 0;
            const hor = this.horizontal;
            const count = this._dataSource.length;
            const grids = this.grids;
            const rows = Math.ceil(count / grids);
            const is = this.getItemSize(0);
            const size = new Size(...is);
            const spacing = this.$spacing;
            const vitems = this._vitems;
            if (hor) {
                size.height = this._minHeight;
            } else {
                size.width = this._minWidth;
            }
            for (let r = 0, i = 0, item: VirtualItem; r < rows; r++) {
                if (hor) {
                    startY = 0;
                } else {
                    startX = 0;
                    startY -= size.height;
                }
                for (let c = 0; c < grids; c++) {
                    i = r * grids + c;
                    if (i >= count) return;
                    item = vitems[i];
                    item.i = i;
                    if (hor) {
                        item.x = startX;
                        item.y = startY + size.height / 2 - is[1] / 2 - ((size.height - is[1]) / (grids - 1)) * c;
                    } else {
                        item.x = startX - size.width / 2 + is[0] / 2 + ((size.width - is[0]) / (grids - 1)) * c;
                        item.y = startY;
                    }
                }
                if (hor) {
                    startX += is[0];
                    startX += spacing;
                } else {
                    startY -= spacing;
                }
            }
        }
    }

    /**
     * 切换虚拟子项的折叠状态
     * @param vitem 虚拟子项
     * @returns
     */
    public collapse(vitem: VirtualItem) {
        if (!this.singleLayout) return;
        if (!vitem) return;
        if (vitem.m) {
            vitem.c = !vitem.c;
            const t = vitem.t;
            const c = vitem.c;
            for (let i = vitem.i + 1; i < this._vitems.length; i++) {
                if (this._vitems[i].t == t) {
                    this._vitems[i].c = c;
                } else break;
            }
        } else {
            vitem.c = !vitem.c;
        }
        this.refreshView();
    }

    /** 清空数据源 */
    public clear() {
        if (this._dataSource) {
            const count = this._dataSource.length;
            for (let i = count - 1; i >= 0; i--) {
                this.recycleVirtualItem(i);
            }
            this._vitems.length = 0;
            this._dataSource.length = 0;
            this._containerTransform.setContentSize(this.calculateSize());
            this.drawContainerBounds();
            this.scrollToStart();
        }
    }

    /**
     * 预取子项尺寸
     * @param index 索引
     * @returns [number, number]
     */
    protected preGetItemSize(index: number): [number, number] {
        if (this._vitems[index]) {
            return [this._vitems[index].w, this._vitems[index].h];
        } else {
            return this.getItemSize(index);
        }
    }

    /**
     * 更新子项尺寸
     * @param index 索引
     * @param width 宽度
     * @param height 高度
     */
    public updateItemSize(index: number, width: number, height: number) {
        if (this.singleLayout && this._vitems[index]) {
            if (this._vitems[index].w != width || this._vitems[index].h != height) {
                this._vitems[index].w = width;
                this._vitems[index].h = height;
                this.buildVirtualItems();
            }
        }
    }

    /**
     * 更新子项宽度
     * @param index 索引
     * @param width 宽度
     */
    public updateItemWidth(index: number, width: number) {
        if (this.singleLayout && this._vitems[index] && this._vitems[index].w != width) {
            this._vitems[index].w = width;
            this.buildVirtualItems();
        }
    }

    /**
     * 更新子项高度
     * @param index 索引
     * @param height 高度
     */
    public updateItemHeight(index: number, height: number) {
        if (this.singleLayout && this._vitems[index] && this._vitems[index].h != height) {
            this._vitems[index].h = height;
            this.buildVirtualItems();
        }
    }

    /**
     * 获取指定索引处的子项
     * @param index 索引
     * @returns Node | null
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

    /** 移除第一项 */
    public removeStart() {
        this.removeAt(0);
    }

    /** 移除最后一项 */
    public removeEnd() {
        this.removeAt(this.count - 1);
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

    /** 计算容器尺寸 */
    private calculateSize() {
        if (this.singleLayout) {
            return this.calculateSingleSize();
        } else {
            return this.calculateGridSize();
        }
    }

    /** 计算单项布局尺寸 */
    private calculateSingleSize() {
        let width = 0,
            height = 0,
            size: [number, number],
            uncollapses = 0;
        const hor = this.horizontal;
        const spacing = this.$spacing;
        const count = this.count;
        for (let i = 0; i < count; i++) {
            size = this.preGetItemSize(i);
            if (hor) {
                if (this._vitems[i].m || (!this._vitems[i].m && !this._vitems[i].c)) {
                    width += size[0];
                    uncollapses++;
                }
            } else {
                if (this._vitems[i].m || (!this._vitems[i].m && !this._vitems[i].c)) {
                    height += size[1];
                    uncollapses++;
                }
            }
        }
        if (count > 0) {
            const extraSpacing = Math.max(0, uncollapses - 1) * spacing;
            if (hor) {
                width += extraSpacing;
            } else {
                height += extraSpacing;
            }
        }
        width = Math.max(width, this._minWidth);
        height = Math.max(height, this._minHeight);
        return new Size(width, height);
    }

    /** 计算网格布局尺寸 */
    private calculateGridSize() {
        const hor = this.horizontal;
        const spacing = this.$spacing;
        const count = this.count;
        const row = Math.ceil(count / this.grids);
        let [width, height] = this.getItemSize(0);
        if (hor) {
            width = width * row + (row - 1) * spacing;
        } else {
            height = height * row + (row - 1) * spacing;
        }
        width = Math.max(width, this._minWidth);
        height = Math.max(height, this._minHeight);
        return new Size(width, height);
    }

    /** 更新边界与回弹 */
    private updateBounds() {
        this.checkBounce();
        this.checkVirtualBounds();
    }

    /** 检查虚拟子项的边界 */
    private checkVirtualBounds() {
        for (let i = 0, item: VirtualItem; i < this._vitems.length; i++) {
            item = this._vitems[i];
            item.checkItemBounds();
        }
    }

    /** 检查是否固定滚到底部 */
    private checkEndSticky() {
        if (this.$stickAtEnd && this._stickEndDirty && !this._animating) {
            if (this.isMinSize || this.atEnd) {
                this._stickEndDirty = false;
            } else {
                this.scrollToEnd(this.$bounceTime);
            }
        }
    }

    /** 停止滚动 */
    public stopScroll() {
        Tween.stopAllByTarget(this._container);
        this.unschedule(this.checkScrollMode);
        this._scrolling = false;
        this._scrollDelta = 0;
        this._animating = false;
        this._scrollOffset.set(0, 0);
    }

    /**
     * 是否停在指定索引位置
     * @param index 索引
     * @returns
     */
    private isStopAtIndex(index: number) {
        const pos = this.getVirtualPositionAt(index);
        return pos && this._container.position.equals(pos);
    }

    /** 是否停在起始位置 */
    private isStopAtStart() {
        return this._container.position.equals(this.startPos);
        // return this.isStopAtIndex(0);
    }

    /** 是否停在结束位置 */
    private isStopAtEnd() {
        return this._container.position.equals(this.endPos);
        // return this.isStopAtIndex(this.count - 1);
    }

    /**
     * 获取虚拟子项位置
     * @param index 索引
     * @returns
     */
    private getVirtualPositionAt(index: number) {
        const vitem = this._vitems[index];
        if (vitem) {
            const pos = vitem.position;
            if (this.horizontal) {
                pos.x = -pos.x - this._minWidth / 2 + this.$spacing / 2 + vitem.w / 2;
                pos.x = Math.max(pos.x, -this.containerSize.width + this.minWidth / 2 + this.$spacing / 2);
                if (this.gridLayout) pos.y = this._startPos.y;
            } else {
                pos.y = -pos.y - vitem.h / 2 - this.$spacing / 2 + this._minHeight / 2;
                pos.y = Math.min(pos.y, this.containerSize.height - this._minHeight / 2 - this.$spacing / 2);
                if (this.gridLayout) pos.x = this._startPos.x;
            }
            return pos;
        }
        return null;
    }

    /** 检查是否滚动到指定位置 */
    private checkScrollMode() {
        let ok: boolean | undefined;
        switch (this._scrollMode) {
            case LIST_SCROLL_MODE.INDEX:
                ok = this.isStopAtIndex(this._toIndex);
                break;
            case LIST_SCROLL_MODE.END:
                ok = this.isStopAtEnd();
                break;
            case LIST_SCROLL_MODE.START:
                ok = this.isStopAtStart();
                break;
            default:
                break;
        }
        if (ok != undefined) {
            if (ok) {
                this._scrollMode = LIST_SCROLL_MODE.STOP;
                this.stopScroll();
                this.updateBounds();
            } else {
                this.scrollToIndex(this._toIndex);
            }
        }
    }

    /**
     * 滚动到指定位置
     * @param position 目标位置
     * @param delta 动画时间
     */
    private scrollTo(position: Vec3, delta: number = 0) {
        if (this.isMinSize) {
            position = this.startPos;
        }
        if (this._container.position.equals(position)) {
            this.checkVirtualBounds();
            return;
        }

        this.stopScroll();
        delta = delta || 0.016;
        this._animating = true;
        const self = this;
        const end = function () {
            self.updateBounds();
            self.schedule(self.checkScrollMode);
        };
        tween(this._container).to(delta, { position }).call(end).start();
    }

    /**
     * 滚动到指定索引
     * @param index 索引
     * @param delta 动画时间
     */
    public scrollToIndex(index: number, delta: number = 0) {
        if (index == 0) {
            this.scrollToStart(delta);
            return;
        }

        if (index == this.count - 1) {
            this.scrollToEnd(delta);
            return;
        }

        const pos = this.getVirtualPositionAt(index);
        if (pos) {
            this._toIndex = index;
            this._scrollMode = LIST_SCROLL_MODE.INDEX;
            this.scrollTo(pos, delta);
        }
    }

    /**
     * 滚动到开始处
     * @param delta 动画时间
     */
    public scrollToStart(delta: number = 0) {
        this._scrollMode = LIST_SCROLL_MODE.START;
        this._toIndex = 0;
        this.scrollTo(this.startPos, delta);
    }

    /**
     * 滚动到结束处
     * @param delta 动画时间
     */
    public scrollToEnd(delta: number = 0) {
        this._scrollMode = LIST_SCROLL_MODE.END;
        this._toIndex = this.count - 1;
        this.scrollTo(this.endPos, delta);
    }

    /**
     * 获取子项尺寸
     * @param index 索引
     * @abstract
     * @returns
     */
    protected abstract getItemSize(index: number): [number, number];

    /**
     * 添加子项
     * @param index 索引
     * @abstract
     */
    protected abstract appendItem(index: number): Node;

    /**
     * 渲染子项
     * @param item 子项
     * @param index 索引
     * @abstract
     */
    protected abstract renderItem(item: Node, index: number): void;

    /**
     * 回收子项
     * @param item 子项
     * @abstract
     */
    protected abstract recycleItem(item: Node): void;
}
