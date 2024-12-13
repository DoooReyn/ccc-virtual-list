import { Constructor } from "cc";

const __RESUABLE_ID__ = Symbol("reusable_id");

/** 可复用对象 */
export abstract class ReusableObject {
    public get id(): number {
        return this.constructor[__RESUABLE_ID__];
    }
    /** 对象被取出 */
    protected abstract onAcquire(): void;
    /** 对象被返还 */
    protected abstract onRecycle(): void;
    /** 对象被销毁 */
    protected abstract onDestroy(): void;
}

/** 可复用对象池 */
export default class ReusableObjectPool {
    /** 可复用 id */
    private static Rid: number = 0;
    /** 池子 */
    private _pools: Map<number, ReusableObject[]> = new Map();

    /**
     * 添加模板
     * @param cls 可复用对象模板【类】
     * @param count
     */
    public add(cls: Constructor<ReusableObject>, count: number = 0) {
        let rid: number | undefined = cls[__RESUABLE_ID__];
        if (cls[rid] == undefined) {
            rid = cls[__RESUABLE_ID__] = ReusableObjectPool.Rid++;
        }
        if (!this._pools.has(rid)) {
            const pool = [];
            this._pools.set(rid, pool);
            if (count > 0) {
                for (let i = 0; i < count; i++) {
                    pool[i] = new cls();
                }
            }
        }
    }

    /**
     * 从对象池中取出对象
     * @param cls 可复用对象模板【类】
     * @returns
     */
    public acqruire<T extends ReusableObject>(cls: Constructor<ReusableObject>): T {
        const rid = cls[__RESUABLE_ID__];
        if (rid == undefined) {
            throw new Error("此类不是可复用对象.");
        }

        if (!this._pools.has(rid)) {
            throw new Error(`此对象不属于该对象池: ${rid}.`);
        }

        const pool = this._pools.get(rid)!;
        let item: T = null;
        if (pool.length > 0) {
            item = pool.pop() as T;
        } else {
            item = new cls() as T;
        }
        // @ts-ignore
        item.onAcquire();

        return item;
    }

    /**
     * 返还对象给对象池
     * @param obj 可复用对象【实例】
     */
    public recycle<T extends ReusableObject>(obj: T) {
        const id = obj.id;
        if (!this._pools.has(id)) {
            throw new Error(`此对象不属于该对象池: ${id}.`);
        }

        const pool = this._pools.get(id)!;
        pool.push(obj);
        // @ts-ignore
        obj.onRecycle();
    }

    /**
     * 清空对象池
     * @warning 清空对象池会销毁所有已缓存对象并清空模板
     */
    public clear() {
        this._pools.forEach((pool) => {
            // @ts-ignore
            pool.forEach((obj) => obj.onDestroy());
            pool.length = 0;
        });
        this._pools.clear();
    }
}
