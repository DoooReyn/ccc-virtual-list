import Hooks from "./Hooks";

/**
 * 批量加载记录器
 */
export default class BatchLoader extends Hooks {
    /**
     * 构造函数
     * @param _count 初始数量
     */
    constructor(private _count: number = 0) {
        super();
    }

    /** 完成一次 */
    public dec() {
        this._count--;
        if (this._count <= 0) {
            this._count = 0;
            this.run();
        }
    }
}
