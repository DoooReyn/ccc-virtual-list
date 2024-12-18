import ReusableObjectPool from "./ReusableObjectPool";
import VirtualItem from "./VirtualItem";

/**
 * 虚拟列表子项对象池
 */
export class VirtualItemPool extends ReusableObjectPool {
    private static _inst: VirtualItemPool;
    public static get inst() {
        if (!this._inst) {
            this._inst = new VirtualItemPool();
            this._inst.add(VirtualItem);
        }
        return this._inst;
    }
}
