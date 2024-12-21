import { _decorator, Label, Node, UITransform } from "cc";
import { VirtualList } from "../VirtualList";
import { ListTestItemPool } from "./ListTestItemPool";

const { ccclass, property } = _decorator;

@ccclass("NestedHorList")
export class NestedHorList extends VirtualList {
    protected getItemSize(index: number): [number, number] {
        return [100, 80];
    }
    protected appendItem(index: number): Node {
        const item = ListTestItemPool.inst.acquire("HItem");
        item.on(Node.EventType.SIZE_CHANGED, this.onItemSizeChanged.bind(this, item, index), this);
        return item;
    }

    private onItemSizeChanged(item: Node, index: number) {
        this.updateItemWidth(index, item.getComponent(UITransform).width);
    }

    protected renderItem(item: Node, index: number): void {
        item.getComponentInChildren(Label).string = this.getDataAt(index);
    }

    protected recycleItem(item: Node): void {
        item.targetOff(this);
        ListTestItemPool.inst.recycle(item);
    }
}
