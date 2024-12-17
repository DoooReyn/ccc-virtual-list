import { Rect, Vec3 } from "cc";
import { ReusableObject } from "./ReusableObjectPool";
import { VirtualList } from "./VirtualList";

/** 虚拟列表子项 */
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
    /** 虚拟列表 */
    public list: VirtualList = null;
    /** 矩形边界 */
    private _rect: Rect = new Rect();
    /** 实际子项的位置 */
    public get position() {
        if (this.list.horizontal) {
            return new Vec3(this.x + this.w / 2, this.y, 0);
        } else {
            return new Vec3(this.x, this.y + this.h / 2, 0);
        }
    }
    /**
     * 检查边界
     * @param bounds 容器边界
     */
    public checkBounds(bounds: Rect) {
        this._rect.set(this.x + this.list.container.position.x, this.y + this.list.container.position.y, this.w, this.h);
        const intersects = this._rect.intersects(bounds);
        // @ts-ignore
        intersects ? this.list.onItemShow(this) : this.list.onItemHide(this);
        return intersects;
    }
    /** 重置 */
    protected reset() {
        this.i = this.w = this.h = this.x = this.y = 0;
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
