import { CCInteger, Color, Node, __private } from "cc";
import { LIST_DIRCTION, LIST_LAYOUT } from "./Definitions";
import { TEXT } from "./Text";

type IPropertyOptions = __private._cocos_core_data_decorators_property__IPropertyOptions;

/**
 * 面板属性
 */
export const PROPERTY: Record<string, Record<string, { P: IPropertyOptions; D: any }>> = {
    VIRTUAL_LIST: {
        DEBUG_DRAW: {
            P: { displayName: TEXT.DEBUG_DRAW, tooltip: TEXT.DEBUG_DRAW_TIP, displayOrder: 0 },
            D: false,
        },
        LIST_DIRECTION: {
            P: {
                type: LIST_DIRCTION,
                displayName: TEXT.SCROLL_DIRECTION,
                tooltip: TEXT.SCROLL_DIRECTION_TIP,
                group: { name: TEXT.PARAMETER, displayOrder: 1 },
            },
            D: LIST_DIRCTION.VERTICAL,
        },
        LAYOUT_MODE: {
            P: {
                type: LIST_LAYOUT,
                displayName: TEXT.LAYOUT_MODE,
                tooltip: TEXT.LAYOUT_MODE_TIP,
                group: { name: TEXT.PARAMETER, displayOrder: 1 },
            },
            D: LIST_LAYOUT.SINGLE,
        },
        SPACING: {
            P: {
                type: CCInteger,
                min: 0,
                displayName: TEXT.SPACING,
                tooltip: TEXT.SPACING_TIP,
                group: { name: TEXT.PARAMETER, displayOrder: 1 },
            },
            D: 0,
        },
        STICK_AT_END: {
            P: {
                displayName: TEXT.STICK_AT_END,
                tooltip: TEXT.STICK_AT_END_TIP,
                group: { name: TEXT.PARAMETER, displayOrder: 1 },
            },
            D: false,
        },
        EMPTY_NODE: {
            P: {
                type: Node,
                displayName: TEXT.EMPTY_NODE,
                tooltip: TEXT.EMPTY_NODE_TIP,
                group: { name: TEXT.PARAMETER, displayOrder: 1 },
            },
            D: null,
        },
        PADDING_LEFT: {
            P: {
                displayName: TEXT.PADDING_LEFT,
                tooltip: TEXT.PADDING_LEFT_TIP,
                type: CCInteger,
                group: { name: TEXT.PADDING, displayOrder: 2 },
            },
            D: 0,
        },
        PADDING_RIGHT: {
            P: {
                displayName: TEXT.PADDING_RIGHT,
                tooltip: TEXT.PADDING_RIGHT_TIP,
                type: CCInteger,
                group: { name: TEXT.PADDING, displayOrder: 2 },
            },
            D: 0,
        },
        PADDING_TOP: {
            P: {
                displayName: TEXT.PADDING_TOP,
                tooltip: TEXT.PADDING_TOP_TIP,
                type: CCInteger,
                group: { name: TEXT.PADDING, displayOrder: 2 },
            },
            D: 0,
        },
        PADDING_BOTTOM: {
            P: {
                displayName: TEXT.PADDING_BOTTOM,
                tooltip: TEXT.PADDING_BOTTOM_TIP,
                type: CCInteger,
                group: { name: TEXT.PADDING, displayOrder: 2 },
            },
            D: 0,
        },
        INERTIA: {
            P: {
                displayName: TEXT.INERTIA_SWITCHER,
                tooltip: TEXT.INERTIA_SWITCHER_TIP,
                group: { name: TEXT.INERTIA, displayOrder: 3 },
            },
            D: false,
        },
        SCROLL_SPEED: {
            P: {
                displayName: TEXT.SCROLL_SPEED,
                tooltip: TEXT.SCROLL_SPEED_TIP,
                group: { name: TEXT.INERTIA, displayOrder: 3 },
                min: 0,
            },
            D: 1,
        },
        SCROLL_DELTA: {
            P: {
                type: CCInteger,
                displayName: TEXT.SCROLL_DELTA,
                tooltip: TEXT.SCROLL_DELTA_TIP,
                group: { name: TEXT.INERTIA, displayOrder: 3 },
            },
            D: 300,
        },
        SCROLL_SPAN: {
            P: {
                type: CCInteger,
                displayName: TEXT.SCROLL_SPAN,
                tooltip: TEXT.SCROLL_SPAN_TIP,
                group: { name: TEXT.INERTIA, displayOrder: 3 },
            },
            D: 60,
        },
        BOUNCABLE: {
            P: {
                displayName: TEXT.BOUNCE_SWITCHER,
                tooltip: TEXT.BOUNCE_SWITCHER_TIP,
                group: { name: TEXT.BOUNCE, displayOrder: 4 },
            },
            D: true,
        },
        BOUNCE_TIME: {
            P: {
                min: 0,
                displayName: TEXT.BOUNCE_TIME,
                tooltip: TEXT.BOUNCE_TIME_TIP,
                group: { name: TEXT.BOUNCE, displayOrder: 4 },
            },
            D: 0.1,
        },
        GRID: {
            P: {
                type: CCInteger,
                min: 1,
                displayName: TEXT.GRID_COLUMN,
                tooltip: TEXT.GRID_COLUMN_TIP,
                group: { name: TEXT.GRID, displayOrder: 5 },
            },
            D: 1,
        },
        USE_SCROLL_BAR: {
            P: {
                displayName: TEXT.SCROLL_BAR_SWITCHER,
                tooltip: TEXT.SCROLL_BAR_SWITCHER_TIP,
                group: { name: TEXT.SCROLL_BAR, displayOrder: 6 },
            },
            D: false,
        },
        SCROLL_BAR_COLOR: {
            P: {
                displayName: TEXT.SCROLL_BAR_COLOR,
                tooltip: TEXT.SCROLL_BAR_COLOR_TIP,
                group: { name: TEXT.SCROLL_BAR, displayOrder: 6 },
            },
            D: new Color(0, 0, 0, 120),
        },
        SCROLL_BAR_SPAN: {
            P: {
                type: CCInteger,
                min: 1,
                displayName: TEXT.SCROLL_BAR_SIZE,
                tooltip: TEXT.SCROLL_BAR_SIZE_TIP,
                group: { name: TEXT.SCROLL_BAR, displayOrder: 6 },
            },
            D: 3,
        },
        SCROLL_BAR_TIME: {
            P: {
                displayName: TEXT.SCROLL_BAR_TIME,
                tooltip: TEXT.SCROLL_BAR_TIME_TIP,
                group: { name: TEXT.SCROLL_BAR, displayOrder: 6 },
            },
            D: 0.5,
        },
    },
} as const;
