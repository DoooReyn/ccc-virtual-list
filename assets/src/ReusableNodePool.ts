import { Node, Prefab, AssetManager, instantiate, isValid } from "cc";
import Hook from "./Hook";

/** 模板节点支持类型 */
type VTemplate = Node | Prefab;

/** 模板对象标记 */
const __TEMPLATE_TAG__ = Symbol("template");

/**
 * 可复用节点池
 */
export default class ReusableNodePool {
    /** 模板 */
    private _templates: AssetManager.Cache<VTemplate>;
    /** 池子 */
    private _pools: AssetManager.Cache<Node[]>;
    /** 取出钩子 */
    private _getHook: Hook;
    /** 返还钩子 */
    private _putHook: Hook;

    constructor() {
        this._templates = new AssetManager.Cache<VTemplate>();
        this._pools = new AssetManager.Cache<Node[]>();
    }

    /**
     * 添加模板
     * @param template 模板
     */
    public add(template: VTemplate) {
        const name = template.name;
        if (this._templates.has(name)) {
            throw new Error(`模板 ${name} 已存在，请勿重复设置.`);
        }
        this._templates.add(name, template);
        this._pools.add(name, []);
    }

    /**
     * 批量添加模板
     * @param templates 模板数组
     */
    public addMany(...templates: VTemplate[]) {
        templates.forEach((template) => this.add(template));
    }

    /**
     * 设置取出钩子
     * @param hook 钩子
     * @param thisArg 钩子 this 指向
     */
    public hookGet(hook: Function, thisArg: any) {
        if (this._getHook) {
            this._getHook.set(hook, thisArg);
        } else {
            this._getHook = new Hook(hook, thisArg);
        }
    }

    /**
     * 设置返还钩子
     * @param hook 钩子
     * @param thisArg 钩子 this 指向
     */
    public hookPut(hook: Function, thisArg: any) {
        if (this._putHook) {
            this._putHook.set(hook, thisArg);
        } else {
            this._putHook = new Hook(hook, thisArg);
        }
    }

    /**
     * 从对象池中取出节点
     * @param name 模板名称
     */
    public acquire(name: string): Node {
        const template = this._templates.get(name);
        if (template) {
            let item: Node;
            let pool = this._pools.get(name);
            if (pool && pool.length > 0) {
                item = pool.pop();
            } else {
                item = instantiate(template) as Node;
                item[__TEMPLATE_TAG__] = name;
            }
            if (this._getHook) {
                this._getHook.runWith(item);
            }
            return item;
        }
        throw new Error(`模板 ${name} 不存在，请先设置模板.`);
    }

    /**
     * 返还节点给对象池
     * @param node 节点
     */
    public recycle(node: Node) {
        const name = node[__TEMPLATE_TAG__];
        if (name) {
            const pool = this._pools.get(name);
            if (pool) {
                if (this._putHook) {
                    this._putHook.runWith(node);
                }
                node.removeFromParent();
                pool.push(node);
            } else {
                throw new Error(`节点 ${node.name} 不属于该对象池，请检查调用方式.`);
            }
        } else {
            throw new Error(`节点 ${node.name} 不是可复用节点，请检查调用方式.`);
        }
    }

    /**
     * 清空对象池
     * @warning 清空对象池会销毁所有已缓存对象并清空模板
     */
    public clear() {
        this._templates.clear();
        this._pools.forEach((pool) => {
            pool.forEach((item) => item.destroy());
            pool.length = 0;
        });
        this._pools.clear();
    }
}
