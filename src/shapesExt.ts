// 図形・形状生成用の拡張機能
// シンプルな3D図形から複雑なベジェ曲線まで対応
namespace shapes {
    /**
     * Place blocks along a bezier curve with variable number of control points.
     * @param startPoint Starting position of the curve
     * @param controlPoints Array of control points that influence the curve shape
     * @param endPoint Ending position of the curve
     * @param blockType Block type to place
     */
    //% weight=8
    //% blockId=minecraftPlaceVariableBezierCurve
    //% block="place %block=minecraftBlock blocks in variable bezier curve from $startPoint to $endPoint with control points $controlPoints"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% startPoint.shadow=minecraftCreateWorldInternal
    //% endPoint.shadow=minecraftCreateWorldInternal
    export function PlaceVariableBezierCurve(startPoint: Position, controlPoints: Position[], endPoint: Position, block: number): void {
        const positions = coordinates.getVariableBezierCurvePositions(startPoint, controlPoints, endPoint);
        for (let pos of positions) {
            blocks.place(block, pos);
        }
    }

    /**
     * Create a cylinder (circular prism) by placing blocks
     * @param center Center position of the cylinder base
     * @param radius Radius of the cylinder
     * @param height Height of the cylinder
     * @param block Block type to place
     * @param hollow Whether to create a hollow cylinder (default: false)
     */
    //% weight=20
    //% blockId=minecraftCreateCylinder
    //% block="create cylinder with %block=minecraftBlock at center $center radius $radius height $height || hollow $hollow"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% height.min=1 height.max=100 height.defl=10
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    export function createCylinder(center: Position, radius: number, height: number, block: number, hollow: boolean = false): void {
        const positions = coordinates.getCylinderPositions(center, radius, height, hollow);
        for (let pos of positions) {
            blocks.place(block, pos);
        }
    }

    /**
     * Create a cone by placing blocks
     * @param center Center position of the cone base
     * @param radius Radius of the cone base
     * @param height Height of the cone
     * @param block Block type to place
     * @param hollow Whether to create a hollow cone (default: false)
     */
    //% weight=19
    //% blockId=minecraftCreateCone
    //% block="create cone with %block=minecraftBlock at center $center radius $radius height $height || hollow $hollow"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% height.min=1 height.max=100 height.defl=10
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    export function createCone(center: Position, radius: number, height: number, block: number, hollow: boolean = false): void {
        const positions = coordinates.getConePositions(center, radius, height, hollow);
        for (let pos of positions) {
            blocks.place(block, pos);
        }
    }

    /**
     * Create a torus (donut shape) by placing blocks
     * @param center Center position of the torus
     * @param majorRadius Major radius (distance from center to tube center)
     * @param minorRadius Minor radius (tube thickness)
     * @param block Block type to place
     * @param hollow Whether to create a hollow torus (default: false)
     */
    //% weight=18
    //% blockId=minecraftCreateTorus
    //% block="create torus with %block=minecraftBlock at center $center major radius $majorRadius minor radius $minorRadius || hollow $hollow"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% majorRadius.min=3 majorRadius.max=50 majorRadius.defl=8
    //% minorRadius.min=1 minorRadius.max=20 minorRadius.defl=3
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    export function createTorus(center: Position, majorRadius: number, minorRadius: number, block: number, hollow: boolean = false): void {
        const positions = coordinates.getTorusPositions(center, majorRadius, minorRadius, hollow);
        for (let pos of positions) {
            blocks.place(block, pos);
        }
    }


    /**
     * Create an ellipsoid by placing blocks
     * @param center Center position of the ellipsoid
     * @param radiusX Radius along X axis
     * @param radiusY Radius along Y axis
     * @param radiusZ Radius along Z axis
     * @param block Block type to place
     * @param hollow Whether to create a hollow ellipsoid (default: false)
     */
    //% weight=17
    //% blockId=minecraftCreateEllipsoid
    //% block="create ellipsoid with %block=minecraftBlock at center $center X radius $radiusX Y radius $radiusY Z radius $radiusZ || hollow $hollow"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% radiusX.min=1 radiusX.max=50 radiusX.defl=5
    //% radiusY.min=1 radiusY.max=50 radiusY.defl=3
    //% radiusZ.min=1 radiusZ.max=50 radiusZ.defl=7
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    export function createEllipsoid(center: Position, radiusX: number, radiusY: number, radiusZ: number, block: number, hollow: boolean = false): void {
        const positions = coordinates.getEllipsoidPositions(center, radiusX, radiusY, radiusZ, hollow);
        for (let pos of positions) {
            blocks.place(block, pos);
        }
    }

    /**
     * Create a helix (spiral) by placing blocks
     * @param center Center position of the helix base
     * @param radius Radius of the helix
     * @param height Total height of the helix
     * @param turns Number of complete turns (rotations)
     * @param block Block type to place
     * @param clockwise Whether to rotate clockwise (default: true)
     */
    //% weight=16
    //% blockId=minecraftCreateHelix
    //% block="create helix with %block=minecraftBlock at center $center radius $radius height $height turns $turns || clockwise $clockwise"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=1 radius.max=50 radius.defl=5
    //% height.min=2 height.max=100 height.defl=20
    //% turns.min=0.5 turns.max=20 turns.defl=3
    //% clockwise.shadow=toggleOnOff clockwise.defl=true
    //% expandableArgumentMode="toggle"
    export function createHelix(center: Position, radius: number, height: number, turns: number, block: number, clockwise: boolean = true): void {
        const positions = coordinates.getHelixPositions(center, radius, height, turns, clockwise);
        for (let pos of positions) {
            blocks.place(block, pos);
        }
    }

    /**
     * Create a paraboloid (satellite dish shape) by placing blocks
     * @param center Center position of the paraboloid base
     * @param radius Maximum radius at the top
     * @param height Height of the paraboloid
     * @param block Block type to place
     * @param hollow Whether to create a hollow paraboloid (default: false)
     */
    //% weight=15
    //% blockId=minecraftCreateParaboloid
    //% block="create paraboloid with %block=minecraftBlock at center $center radius $radius height $height || hollow $hollow"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% radius.min=2 radius.max=50 radius.defl=8
    //% height.min=1 height.max=50 height.defl=10
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    export function createParaboloid(center: Position, radius: number, height: number, block: number, hollow: boolean = false): void {
        const positions = coordinates.getParaboloidPositions(center, radius, height, hollow);
        for (let pos of positions) {
            blocks.place(block, pos);
        }
    }

    /**
     * Create a hyperboloid (cooling tower shape) by placing blocks
     * @param center Center position of the hyperboloid
     * @param baseRadius Radius at the base
     * @param waistRadius Radius at the narrowest point (waist)
     * @param height Total height of the hyperboloid
     * @param block Block type to place
     * @param hollow Whether to create a hollow hyperboloid (default: false)
     */
    //% weight=14
    //% blockId=minecraftCreateHyperboloid
    //% block="create hyperboloid with %block=minecraftBlock at center $center base radius $baseRadius waist radius $waistRadius height $height || hollow $hollow"
    //% block.shadow=minecraftBlock
    //% center.shadow=minecraftCreateWorldInternal
    //% baseRadius.min=3 baseRadius.max=50 baseRadius.defl=10
    //% waistRadius.min=1 waistRadius.max=30 waistRadius.defl=5
    //% height.min=4 height.max=100 height.defl=20
    //% hollow.shadow=toggleOnOff hollow.defl=false
    //% expandableArgumentMode="toggle"
    export function createHyperboloid(center: Position, baseRadius: number, waistRadius: number, height: number, block: number, hollow: boolean = false): void {
        const positions = coordinates.getHyperboloidPositions(center, baseRadius, waistRadius, height, hollow);
        for (let pos of positions) {
            blocks.place(block, pos);
        }
    }

}