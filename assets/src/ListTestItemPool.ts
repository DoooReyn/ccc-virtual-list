import ReusableNodePool from "./ReusableNodePool";

/**
 * 虚拟列表测试·节点对象池
 */
export class ListTestItemPool extends ReusableNodePool {
    private static _inst: ListTestItemPool;
    static get inst() {
        if (!this._inst) {
            this._inst = new ListTestItemPool();
        }
        return this._inst;
    }
}
