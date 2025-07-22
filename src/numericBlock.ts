namespace agent {
    /**
     * Inspects a numeric's block in the specified direction and returns the Value
     * @param direction the direction in which to inspect
     */
    //% group="Numeric Block"
    //% blockId=minecraftinspectNumericBlockt 
    //% block="agent numeric inspect %direction"
    //% direction.shadow=minecraftAgentSixDirection
    //% weight=9999
    export function inspectNumericBlock(direction: number): number {

        const blockId: number = agent.inspect(AgentInspection.Block, direction);
        switch (blockId) {
            case BLACK_WOOL:
                return 0;
            case BROWN_WOOL:
                return 1;
            case RED_WOOL:
                return 2;
            case ORANGE_WOOL:
                return 3;
            case YELLOW_WOOL:
                return 4;
            case GREEN_WOOL:
                return 5;
            case BLUE_WOOL:
                return 6;
            case PURPLE_WOOL:
                return 7;
            case GRAY_WOOL:
                return 8;
            case WOOL:
                return 9;
            default:
                player.warningMessage("Not Numeric Block. Value is null.");
                return null;
        }

    };
}
