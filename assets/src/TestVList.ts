import ReusableNodePool from "./ReusableNodePool";
import { VList } from "./VList";
import { _decorator, Label, Node } from "cc";
const { ccclass } = _decorator;

const VNodePool = new ReusableNodePool();

@ccclass("TestVList")
export class TestVList extends VList {
    protected start(): void {
        VNodePool.add(this.node.parent.getChildByName("HItem"));
        VNodePool.add(this.node.parent.getChildByName("VItem"));
        this.data = new Array(100).fill(0).map((_, i) => i + 1);
    }

    protected onEnable(): void {
        VNodePool.onHookAcquire(this.onItemAcquire, this);
        VNodePool.onHookRecycle(this.onItemRecycle, this);
        super.onEnable();
    }

    protected onDisable(): void {
        VNodePool.offHookGet(this.onItemAcquire, this);
        VNodePool.offHookRecycle(this.onItemAcquire, this);
        super.onDisable();
    }

    /** 添加实体子项 */
    protected appendRealItem() {
        const item = VNodePool.acquire(this.horizontal ? "HItem" : "VItem");
        item.active = true;
        this._container.addChild(item);
        return item;
    }

    protected recycleItem(item: Node): void {
        VNodePool.recycle(item);
    }

    protected onItemAcquire(item: Node) {
        const index = item["$vid"];
        item.getChildByName("Label").getComponent(Label).string = this._dataSource[index].toString();
    }
    protected onItemRecycle(item: Node) {
        
    }
}
