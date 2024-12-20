import { Rect, Vec3 } from "cc";
import { ReusableObject } from "./ReusableObjectPool";
import { VirtualList } from "./VirtualList";

/**
 * 虚拟列表子项
 */
export default class VirtualItem extends ReusableObject {
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
    /** 是否树的根节点 */
    public m: boolean = false;
    /** 所属树 */
    public t: number = 0;
    /** 是否折叠（折叠的子项不会被渲染） */
    public c: boolean = false;
    /** 虚拟列表 */
    public l: VirtualList = null;
    /** 矩形边界 */
    private _r: Rect = new Rect();

    /** 实际子项的位置 */
    public get position() {
        if (this.l.horizontal) {
            return new Vec3(this.x + this.w / 2, this.y, 0);
        } else {
            return new Vec3(this.x, this.y + this.h / 2, 0);
        }
    }

    /**
     * 检查子项边界
     * @param bounds 容器边界
     */
    public checkBounds(bounds: Rect) {
        if (this.c && !this.m) return false;
        const { x, y } = this.l.container.position;
        this._r.set(this.x + x, this.y + y, this.w, this.h);
        return this._r.intersects(bounds);
    }

    /** 检查子项边界 */
    public checkItemBounds() {
        this.checkBounds(this.l.viewBounds) ? this.l.onItemShow(this) : this.l.onItemHide(this);
    }

    /** 重置 */
    protected reset() {
        this.i = this.w = this.h = this.x = this.y = 0;
        this.c = false;
        this.m = false;
        this.t = 0;
        this.l = null;
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
