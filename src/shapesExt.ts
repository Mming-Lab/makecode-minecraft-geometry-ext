// Shape and form generation extension (using optimized algorithms)
// Supports from simple 3D shapes to complex Bezier curves
//% block="図形" weight=10 color=#FF6B35 icon="\uf1b2" advanced=true
namespace shapes {
    
    // Using standard MakeCode ShapeOperation enum
    // ShapeOperation.Replace, ShapeOperation.Outline, ShapeOperation.Hollow
    
    /**
     * Place blocks in batches using coordinates.BATCH_SIZE for optimal performance
     * @param positions Array of positions to place blocks at
     * @param block Block type to place
     * @param operation Shape operation type (Replace, Outline, Hollow)
     */
    function batchPlaceBlocks(positions: Position[], block: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        if (!positions || positions.length === 0) {
            return;
        }
        
        // Handle hollow operation by first placing air, then outline
        if (operation === ShapeOperation.Hollow) {
            // For hollow, we need to implement it at shape level, not here
            // This is handled in individual shape functions
        }
        
        for (let i = 0; i < positions.length; i += coordinates.BATCH_SIZE) {
            const batch = positions.slice(i, i + coordinates.BATCH_SIZE);
            const progress = Math.round(((i + batch.length) / positions.length) * 100);
            player.say(`Placing ${progress}%`);
            coordinates.optimizedFill(batch, block);
        }
    }
    /**
     * Place blocks along a bezier curve with variable number of control points.
     * Uses optimized curve generation algorithm for smooth results.
     * @param startPoint Starting position of the curve
     * @param controlPoints Array of control points that influence the curve shape
     * @param endPoint Ending position of the curve
     * @param blockType Block type to place
     */
    //% weight=8
    //% blockId=minecraftVariableBezier
    //% block="variable bezier of %block=minecraftBlock|from %startPoint=minecraftCreatePosition|to %endPoint=minecraftCreatePosition|with control points %controlPoints"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% group="Lines and Curves"
    export function variableBezier(block: number, startPoint: Position, endPoint: Position, controlPoints: Position[]): void {
        const positions = coordinates.getVariableBezierCurvePositions(startPoint, controlPoints, endPoint);
        batchPlaceBlocks(positions, block);
    }

    /**
     * Create a line between two points by placing blocks
     * @param p0 Starting position of the line
     * @param p1 Ending position of the line
     * @param block Block type to place
     */
    //% weight=100
    //% blockId=minecraftOptimizedLine
    //% block="optimized line of %block=minecraftBlock|from %p0=minecraftCreatePosition|to %p1=minecraftCreatePosition"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% group="Basic Shapes"
    export function optimizedLine(block: number, p0: Position, p1: Position): void {
        const positions = coordinates.getLinePositions(p0, p1);
        batchPlaceBlocks(positions, block);
    }

    /**
     * Create a circle by placing blocks
     * @param center Center position of the circle
     * @param radius Radius of the circle (1-50 blocks)
     * @param orientation Circle orientation (X, Y, or Z axis)
     * @param block Block type to place
     * @param hollow Whether to create a hollow circle (outline only)
     */
    //% weight=95
    //% blockId=minecraftOptimizedCircle
    //% block="optimized circle of %block=minecraftBlock|center %center=minecraftCreatePosition|radius %radius|around %orientation|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% radius.min=1 radius.max=200 radius.defl=5
    //% group="Basic Shapes"
    export function optimizedCircle(block: number, center: Position, radius: number, orientation: Axis, operation: ShapeOperation = ShapeOperation.Replace): void {
        if (operation === ShapeOperation.Hollow) {
            // Create filled circle with air, then outline
            const positions = coordinates.getCirclePositions(center, radius, orientation, false);
            batchPlaceBlocks(positions, Block.Air);
            const outlinePositions = coordinates.getCirclePositions(center, radius, orientation, true);
            batchPlaceBlocks(outlinePositions, block);
        } else {
            const hollow = operation === ShapeOperation.Outline;
            const positions = coordinates.getCirclePositions(center, radius, orientation, hollow);
            batchPlaceBlocks(positions, block);
        }
    }

    /**
     * Create a sphere by placing blocks using optimized algorithm
     * @param center Center position of the sphere
     * @param radius Radius of the sphere (1-50 blocks)
     * @param block Block type to place
     * @param hollow Whether to create a hollow sphere (shell only)
     * @param density Density factor for position sampling (0.1-1.0, default: 1.0)
     */
    //% weight=90
    //% blockId=minecraftOptimizedSphere
    //% block="optimized sphere of %block=minecraftBlock|center %center=minecraftCreatePosition|radius %radius|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% radius.min=1 radius.max=200 radius.defl=5
    //% group="3D Shapes (Optimized)"
    //% advanced=true
    export function optimizedSphere(block: number, center: Position, radius: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        // Parameter validation
        if (!center) {
            player.say("Error: Invalid center position");
            return;
        }
        if (radius <= 0) {
            player.say("Error: Radius must be positive");
            return;
        }
        
        const density = 1.0; // Fixed density for standard compatibility
        
        if (operation === ShapeOperation.Hollow) {
            // Create filled sphere with air, then shell
            const filledPositions = coordinates.getSpherePositions(center, radius, false, density);
            batchPlaceBlocks(filledPositions, Block.Air);
            const shellPositions = coordinates.getSpherePositions(center, radius, true, density);
            batchPlaceBlocks(shellPositions, block);
        } else {
            const hollow = operation === ShapeOperation.Outline;
            const positions = coordinates.getSpherePositions(center, radius, hollow, density);
            batchPlaceBlocks(positions, block);
        }
    }

    /**
     * Create a cuboid (rectangular prism) by placing blocks
     * @param corner1 First corner position of the cuboid
     * @param corner2 Opposite corner position of the cuboid
     * @param block Block type to place
     * @param hollow Whether to create a hollow cuboid (shell only)
     */
    //% weight=85
    //% blockId=minecraftCuboid
    //% block="cuboid of %block=minecraftBlock|from %corner1=minecraftCreatePosition|to %corner2=minecraftCreatePosition|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% group="3D Shapes (Basic)"
    export function cuboid(block: number, corner1: Position, corner2: Position, operation: ShapeOperation = ShapeOperation.Replace): void {
        if (operation === ShapeOperation.Hollow) {
            const filledPositions = coordinates.getCuboidPositions(corner1, corner2, false);
            batchPlaceBlocks(filledPositions, Block.Air);
            const shellPositions = coordinates.getCuboidPositions(corner1, corner2, true);
            batchPlaceBlocks(shellPositions, block);
        } else {
            const hollow = operation === ShapeOperation.Outline;
            const positions = coordinates.getCuboidPositions(corner1, corner2, hollow);
            batchPlaceBlocks(positions, block);
        }
    }

    /**
     * Create a cylinder using optimized building algorithm
     * @param center Center position of the cylinder base
     * @param radius Radius of the cylinder (1-50 blocks)
     * @param height Height of the cylinder (1-100 blocks)
     * @param block Block type to place
     * @param hollow Whether to create a hollow cylinder (default: false)
     */
    //% weight=80
    //% blockId=minecraftCylinder
    //% block="cylinder of %block=minecraftBlock|center %center=minecraftCreatePosition|radius %radius|height %height|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% radius.min=1 radius.max=200 radius.defl=5
    //% height.min=1 height.max=300 height.defl=10
    //% group="3D Shapes (Optimized)"
    export function cylinder(block: number, center: Position, radius: number, height: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        if (operation === ShapeOperation.Hollow) {
            const filledPositions = coordinates.getCylinderPositions(center, radius, height, false);
            batchPlaceBlocks(filledPositions, Block.Air);
            const shellPositions = coordinates.getCylinderPositions(center, radius, height, true);
            batchPlaceBlocks(shellPositions, block);
        } else {
            const hollow = operation === ShapeOperation.Outline;
            const positions = coordinates.getCylinderPositions(center, radius, height, hollow);
            batchPlaceBlocks(positions, block);
        }
    }

    /**
     * Create a cone by placing blocks
     * @param center Center position of the cone base
     * @param radius Radius of the cone base (1-50 blocks)
     * @param height Height of the cone (1-100 blocks)
     * @param block Block type to place
     * @param hollow Whether to create a hollow cone (default: false)
     */
    //% weight=75
    //% blockId=minecraftCone
    //% block="cone of %block=minecraftBlock|center %center=minecraftCreatePosition|radius %radius|height %height|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% radius.min=1 radius.max=200 radius.defl=5
    //% height.min=1 height.max=300 height.defl=10
    //% group="3D Shapes (Basic)"
    export function cone(block: number, center: Position, radius: number, height: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        if (operation === ShapeOperation.Hollow) {
            const filledPositions = coordinates.getConePositions(center, radius, height, false);
            batchPlaceBlocks(filledPositions, Block.Air);
            const shellPositions = coordinates.getConePositions(center, radius, height, true);
            batchPlaceBlocks(shellPositions, block);
        } else {
            const hollow = operation === ShapeOperation.Outline;
            const positions = coordinates.getConePositions(center, radius, height, hollow);
            batchPlaceBlocks(positions, block);
        }
    }

    /**
     * Create a torus (donut shape) by placing blocks
     * @param center Center position of the torus
     * @param majorRadius Major radius (distance from center to tube center, 3-50 blocks)
     * @param minorRadius Minor radius (tube thickness, 1-20 blocks)
     * @param block Block type to place
     * @param hollow Whether to create a hollow torus (default: false)
     */
    //% weight=70
    //% blockId=minecraftTorus
    //% block="torus of %block=minecraftBlock|center %center=minecraftCreatePosition|major radius %majorRadius|minor radius %minorRadius|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% majorRadius.min=3 majorRadius.max=200 majorRadius.defl=8
    //% minorRadius.min=1 minorRadius.max=100 minorRadius.defl=3
    //% group="Complex Shapes"
    export function torus(block: number, center: Position, majorRadius: number, minorRadius: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        if (operation === ShapeOperation.Hollow) {
            const filledPositions = coordinates.getTorusPositions(center, majorRadius, minorRadius, false);
            batchPlaceBlocks(filledPositions, Block.Air);
            const shellPositions = coordinates.getTorusPositions(center, majorRadius, minorRadius, true);
            batchPlaceBlocks(shellPositions, block);
        } else {
            const hollow = operation === ShapeOperation.Outline;
            const positions = coordinates.getTorusPositions(center, majorRadius, minorRadius, hollow);
            batchPlaceBlocks(positions, block);
        }
    }


    /**
     * Create an ellipsoid using optimized building algorithm
     * @param center Center position of the ellipsoid
     * @param radiusX Radius along X axis (1-50 blocks)
     * @param radiusY Radius along Y axis (1-50 blocks)
     * @param radiusZ Radius along Z axis (1-50 blocks)
     * @param block Block type to place
     * @param hollow Whether to create a hollow ellipsoid (default: false)
     */
    //% weight=65
    //% blockId=minecraftEllipsoid
    //% block="ellipsoid of %block=minecraftBlock|center %center=minecraftCreatePosition|X radius %radiusX|Y radius %radiusY|Z radius %radiusZ|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% radiusX.min=1 radiusX.max=200 radiusX.defl=5
    //% radiusY.min=1 radiusY.max=200 radiusY.defl=3
    //% radiusZ.min=1 radiusZ.max=200 radiusZ.defl=7
    //% group="3D Shapes (Optimized)"
    export function ellipsoid(block: number, center: Position, radiusX: number, radiusY: number, radiusZ: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        if (operation === ShapeOperation.Hollow) {
            const filledPositions = coordinates.getEllipsoidPositions(center, radiusX, radiusY, radiusZ, false);
            batchPlaceBlocks(filledPositions, Block.Air);
            const shellPositions = coordinates.getEllipsoidPositions(center, radiusX, radiusY, radiusZ, true);
            batchPlaceBlocks(shellPositions, block);
        } else {
            const hollow = operation === ShapeOperation.Outline;
            const positions = coordinates.getEllipsoidPositions(center, radiusX, radiusY, radiusZ, hollow);
            batchPlaceBlocks(positions, block);
        }
    }

    /**
     * Create a helix (spiral) by placing blocks
     * @param center Center position of the helix base
     * @param radius Radius of the helix (1-50 blocks)
     * @param height Total height of the helix (2-100 blocks)
     * @param turns Number of complete turns (0.5-20 rotations)
     * @param block Block type to place
     * @param clockwise Whether to rotate clockwise (default: true)
     */
    //% weight=60
    //% blockId=minecraftHelix
    //% block="helix of %block=minecraftBlock|center %center=minecraftCreatePosition|radius %radius|height %height|turns %turns||clockwise %clockwise"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% radius.min=1 radius.max=200 radius.defl=5
    //% height.min=2 height.max=300 height.defl=20
    //% turns.min=0.5 turns.max=20 turns.defl=3
    //% clockwise.shadow=toggleOnOff clockwise.defl=true
    //% expandableArgumentMode="toggle"
    //% group="Complex Shapes"
    export function helix(block: number, center: Position, radius: number, height: number, turns: number, clockwise: boolean = true): void {
        const positions = coordinates.getHelixPositions(center, radius, height, turns, clockwise);
        batchPlaceBlocks(positions, block);
    }

    /**
     * Create a paraboloid (satellite dish shape) by placing blocks
     * @param center Center position of the paraboloid base
     * @param radius Maximum radius at the top (2-50 blocks)
     * @param height Height of the paraboloid (1-50 blocks)
     * @param block Block type to place
     * @param hollow Whether to create a hollow paraboloid (default: false)
     */
    //% weight=55
    //% blockId=minecraftParaboloid
    //% block="paraboloid of %block=minecraftBlock|center %center=minecraftCreatePosition|radius %radius|height %height|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% radius.min=2 radius.max=200 radius.defl=8
    //% height.min=1 height.max=300 height.defl=10
    //% group="Complex Shapes"
    export function paraboloid(block: number, center: Position, radius: number, height: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        if (operation === ShapeOperation.Hollow) {
            const filledPositions = coordinates.getParaboloidPositions(center, radius, height, false);
            batchPlaceBlocks(filledPositions, Block.Air);
            const shellPositions = coordinates.getParaboloidPositions(center, radius, height, true);
            batchPlaceBlocks(shellPositions, block);
        } else {
            const hollow = operation === ShapeOperation.Outline;
            const positions = coordinates.getParaboloidPositions(center, radius, height, hollow);
            batchPlaceBlocks(positions, block);
        }
    }

    /**
     * Create a hyperboloid (cooling tower shape) by placing blocks
     * @param center Center position of the hyperboloid
     * @param baseRadius Radius at the base (3-50 blocks)
     * @param waistRadius Radius at the narrowest point (1-30 blocks)
     * @param height Total height of the hyperboloid (4-100 blocks)
     * @param block Block type to place
     * @param hollow Whether to create a hollow hyperboloid (default: false)
     */
    //% weight=50
    //% blockId=minecraftHyperboloid
    //% block="hyperboloid of %block=minecraftBlock|center %center=minecraftCreatePosition|base radius %baseRadius|waist radius %waistRadius|height %height|%operation"
    //% block.shadow=minecraftBlock
    //% blockExternalInputs=1
    //% baseRadius.min=3 baseRadius.max=200 baseRadius.defl=10
    //% waistRadius.min=1 waistRadius.max=100 waistRadius.defl=5
    //% height.min=4 height.max=300 height.defl=20
    //% group="Complex Shapes"
    export function hyperboloid(block: number, center: Position, baseRadius: number, waistRadius: number, height: number, operation: ShapeOperation = ShapeOperation.Replace): void {
        if (operation === ShapeOperation.Hollow) {
            const filledPositions = coordinates.getHyperboloidPositions(center, baseRadius, waistRadius, height, false);
            batchPlaceBlocks(filledPositions, Block.Air);
            const shellPositions = coordinates.getHyperboloidPositions(center, baseRadius, waistRadius, height, true);
            batchPlaceBlocks(shellPositions, block);
        } else {
            const hollow = operation === ShapeOperation.Outline;
            const positions = coordinates.getHyperboloidPositions(center, baseRadius, waistRadius, height, hollow);
            batchPlaceBlocks(positions, block);
        }
    }

}