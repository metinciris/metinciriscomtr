import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Upload, Download, Image as ImageIcon, RotateCcw } from 'lucide-react';

/**
 * Prizma3D - 3D Box Texture Wrapper
 * 
 * Creates a 3D rectangular prism visualization with a user-uploaded image
 * wrapped seamlessly across the top, front, and right side faces.
 * Uses perspective transformation for realistic image wrapping.
 */

export function Prizma3D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Prism dimensions - larger to fill more canvas
    const PRISM = {
        width: 380,   // front face width
        height: 280,  // front face height  
        depth: 220,   // side depth
    };

    // Isometric projection angle
    const ISO_ANGLE = Math.PI / 6; // 30 degrees

    // Handle image upload
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setUploadedImage(img);
                setIsLoading(false);
            };
            img.onerror = () => setIsLoading(false);
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    }, []);

    // Draw texture with perspective transformation
    const drawTexturedQuad = (
        ctx: CanvasRenderingContext2D,
        img: HTMLImageElement,
        srcPoints: { x: number; y: number }[], // source quad in image
        dstPoints: { x: number; y: number }[], // destination quad on canvas
        lightness: number
    ) => {
        // Use subdivision technique for perspective-correct texturing
        const subdivisions = 12; // Higher = more accurate but slower

        ctx.save();

        // Clip to destination quad
        ctx.beginPath();
        ctx.moveTo(dstPoints[0].x, dstPoints[0].y);
        for (let i = 1; i < dstPoints.length; i++) {
            ctx.lineTo(dstPoints[i].x, dstPoints[i].y);
        }
        ctx.closePath();
        ctx.clip();

        // Draw subdivided triangles for perspective correctness
        for (let y = 0; y < subdivisions; y++) {
            for (let x = 0; x < subdivisions; x++) {
                const u0 = x / subdivisions;
                const v0 = y / subdivisions;
                const u1 = (x + 1) / subdivisions;
                const v1 = (y + 1) / subdivisions;

                // Bilinear interpolation for source coordinates
                const srcTL = bilinearInterpolate(srcPoints, u0, v0);
                const srcTR = bilinearInterpolate(srcPoints, u1, v0);
                const srcBL = bilinearInterpolate(srcPoints, u0, v1);
                const srcBR = bilinearInterpolate(srcPoints, u1, v1);

                // Bilinear interpolation for destination coordinates
                const dstTL = bilinearInterpolate(dstPoints, u0, v0);
                const dstTR = bilinearInterpolate(dstPoints, u1, v0);
                const dstBL = bilinearInterpolate(dstPoints, u0, v1);
                const dstBR = bilinearInterpolate(dstPoints, u1, v1);

                // Draw two triangles per cell
                drawTexturedTriangle(ctx, img,
                    srcTL, srcTR, srcBL,
                    dstTL, dstTR, dstBL
                );
                drawTexturedTriangle(ctx, img,
                    srcTR, srcBR, srcBL,
                    dstTR, dstBR, dstBL
                );
            }
        }

        // Apply lighting overlay
        if (lightness < 1) {
            ctx.fillStyle = `rgba(0, 0, 0, ${1 - lightness})`;
            ctx.beginPath();
            ctx.moveTo(dstPoints[0].x, dstPoints[0].y);
            for (let i = 1; i < dstPoints.length; i++) {
                ctx.lineTo(dstPoints[i].x, dstPoints[i].y);
            }
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    };

    // Bilinear interpolation helper
    const bilinearInterpolate = (
        points: { x: number; y: number }[],
        u: number, v: number
    ): { x: number; y: number } => {
        // points: [topLeft, topRight, bottomRight, bottomLeft]
        const top = {
            x: points[0].x + (points[1].x - points[0].x) * u,
            y: points[0].y + (points[1].y - points[0].y) * u
        };
        const bottom = {
            x: points[3].x + (points[2].x - points[3].x) * u,
            y: points[3].y + (points[2].y - points[3].y) * u
        };
        return {
            x: top.x + (bottom.x - top.x) * v,
            y: top.y + (bottom.y - top.y) * v
        };
    };

    // Draw a textured triangle using affine transformation
    const drawTexturedTriangle = (
        ctx: CanvasRenderingContext2D,
        img: HTMLImageElement,
        src0: { x: number; y: number },
        src1: { x: number; y: number },
        src2: { x: number; y: number },
        dst0: { x: number; y: number },
        dst1: { x: number; y: number },
        dst2: { x: number; y: number }
    ) => {
        ctx.save();

        // Clip to triangle
        ctx.beginPath();
        ctx.moveTo(dst0.x, dst0.y);
        ctx.lineTo(dst1.x, dst1.y);
        ctx.lineTo(dst2.x, dst2.y);
        ctx.closePath();
        ctx.clip();

        // Calculate affine transformation matrix
        const denom = (src0.x - src2.x) * (src1.y - src2.y) - (src1.x - src2.x) * (src0.y - src2.y);
        if (Math.abs(denom) < 0.0001) {
            ctx.restore();
            return;
        }

        const m11 = ((dst0.x - dst2.x) * (src1.y - src2.y) - (dst1.x - dst2.x) * (src0.y - src2.y)) / denom;
        const m12 = ((dst1.x - dst2.x) * (src0.x - src2.x) - (dst0.x - dst2.x) * (src1.x - src2.x)) / denom;
        const m21 = ((dst0.y - dst2.y) * (src1.y - src2.y) - (dst1.y - dst2.y) * (src0.y - src2.y)) / denom;
        const m22 = ((dst1.y - dst2.y) * (src0.x - src2.x) - (dst0.y - dst2.y) * (src1.x - src2.x)) / denom;
        const dx = dst2.x - m11 * src2.x - m12 * src2.y;
        const dy = dst2.y - m21 * src2.x - m22 * src2.y;

        ctx.transform(m11, m21, m12, m22, dx, dy);
        ctx.drawImage(img, 0, 0);

        ctx.restore();
    };

    // Draw the 3D prism with texture
    const drawPrism = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Canvas size
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Center position - account for isometric offset to center the entire shape
        // The prism extends right and up due to isometric depth, so offset left and down
        const isoOffsetX = Math.cos(ISO_ANGLE) * PRISM.depth / 2;
        const isoOffsetY = Math.sin(ISO_ANGLE) * PRISM.depth / 2;
        const centerX = canvasWidth / 2 - isoOffsetX;
        const centerY = canvasHeight / 2 + PRISM.height / 2 + isoOffsetY;

        // Isometric offsets
        const isoX = Math.cos(ISO_ANGLE) * PRISM.depth;
        const isoY = Math.sin(ISO_ANGLE) * PRISM.depth;

        // Define vertices for isometric box
        // Front face (bottom-left origin)
        const frontBottomLeft = { x: centerX - PRISM.width / 2, y: centerY };
        const frontBottomRight = { x: centerX + PRISM.width / 2, y: centerY };
        const frontTopLeft = { x: centerX - PRISM.width / 2, y: centerY - PRISM.height };
        const frontTopRight = { x: centerX + PRISM.width / 2, y: centerY - PRISM.height };

        // Top face (extends back-right in isometric)
        const topBackLeft = { x: frontTopLeft.x + isoX, y: frontTopLeft.y - isoY };
        const topBackRight = { x: frontTopRight.x + isoX, y: frontTopRight.y - isoY };

        // Right face (extends back-right in isometric)
        const rightBackBottom = { x: frontBottomRight.x + isoX, y: frontBottomRight.y - isoY };

        // Draw shadow on floor
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.moveTo(frontBottomLeft.x + 25, centerY + 25);
        ctx.lineTo(frontBottomRight.x + 25, centerY + 25);
        ctx.lineTo(rightBackBottom.x + 25, rightBackBottom.y + 25);
        ctx.lineTo(topBackLeft.x + 25, centerY - isoY + 25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        const imgW = uploadedImage?.width || 1;
        const imgH = uploadedImage?.height || 1;

        if (uploadedImage) {
            // SOURCE COORDINATES for seamless wrapping
            // Strategy: Front face shows bottom-left of image (main subject enlarged)
            // Top face continues from front's TOP edge
            // Right face continues from front's RIGHT edge

            // Define how much of the image goes to each face
            // Front gets most of the image, top and right get the "overflow"
            const frontRatio = 0.75;  // Front face covers 75% of image width/height
            const topDepthRatio = 0.35;  // Top face depth relative to image
            const rightDepthRatio = 0.35; // Right face depth relative to image

            // FRONT FACE: Bottom-left portion of image (main subject area)
            // Image coordinates: from (0, 1-frontRatio) to (frontRatio, 1)
            // But we map it to the full front face
            const frontSrc = [
                { x: 0, y: imgH * (1 - frontRatio) },           // top-left of front = upper part of bottom section
                { x: imgW * frontRatio, y: imgH * (1 - frontRatio) }, // top-right of front
                { x: imgW * frontRatio, y: imgH },               // bottom-right of front
                { x: 0, y: imgH }                                // bottom-left of front
            ];

            // TOP FACE: Continues from front's top edge upward into image
            // The front edge of top matches front's top edge
            // The back edge extends into the upper portion of image
            const topSrc = [
                { x: 0, y: imgH * (1 - frontRatio) },           // front-left (matches front top-left)
                { x: imgW * frontRatio, y: imgH * (1 - frontRatio) }, // front-right (matches front top-right)
                { x: imgW * frontRatio + imgW * rightDepthRatio, y: 0 }, // back-right (upper right of image)
                { x: 0, y: 0 }                                   // back-left (upper left of image)
            ];

            // RIGHT FACE: Continues from front's right edge to the right of image
            // The front edge of right matches front's right edge
            // The back edge extends into the right portion of image
            const rightSrc = [
                { x: imgW * frontRatio, y: imgH * (1 - frontRatio) }, // top-front (matches front top-right)
                { x: imgW, y: 0 },                                // top-back (top-right corner of image)
                { x: imgW, y: imgH },                             // bottom-back (bottom-right of image)
                { x: imgW * frontRatio, y: imgH }                 // bottom-front (matches front bottom-right)
            ];

            // DESTINATION COORDINATES on canvas
            const frontDst = [frontTopLeft, frontTopRight, frontBottomRight, frontBottomLeft];
            const topDst = [frontTopLeft, frontTopRight, topBackRight, topBackLeft];
            const rightDst = [frontTopRight, topBackRight, rightBackBottom, frontBottomRight];

            // Draw faces in back-to-front order (painter's algorithm)
            // 1. Right side face (darkest)
            drawTexturedQuad(ctx, uploadedImage, rightSrc, rightDst, 0.65);

            // 2. Top face (medium light)
            drawTexturedQuad(ctx, uploadedImage, topSrc, topDst, 0.85);

            // 3. Front face (brightest)
            drawTexturedQuad(ctx, uploadedImage, frontSrc, frontDst, 1.0);
        } else {
            // No image - draw placeholder faces
            const drawPlaceholderFace = (
                points: { x: number; y: number }[],
                lightness: number
            ) => {
                ctx.fillStyle = `hsl(270, 30%, ${lightness * 100}%)`;
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.lineWidth = 1;
                ctx.stroke();
            };

            drawPlaceholderFace([frontTopRight, topBackRight, rightBackBottom, frontBottomRight], 0.65);
            drawPlaceholderFace([frontTopLeft, frontTopRight, topBackRight, topBackLeft], 0.85);
            drawPlaceholderFace([frontTopLeft, frontTopRight, frontBottomRight, frontBottomLeft], 1.0);
        }

        // Draw subtle edge highlights
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(frontTopLeft.x, frontTopLeft.y);
        ctx.lineTo(frontTopRight.x, frontTopRight.y);
        ctx.stroke();

    }, [uploadedImage, PRISM.depth, PRISM.height, PRISM.width]);

    // Redraw when image changes
    useEffect(() => {
        drawPrism();
    }, [drawPrism]);

    // Initial draw on mount
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Set canvas size
            canvas.width = 800;
            canvas.height = 600;
            drawPrism();
        }
    }, [drawPrism]);

    // Save canvas as image
    const handleSaveImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = 'prizma-3d.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    // Reset
    const handleReset = () => {
        setUploadedImage(null);
    };

    return (
        <PageContainer>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div
                    className="p-8 mb-8 rounded-xl shadow-lg"
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                    }}
                >
                    <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'white' }}>
                        3D Prizma Görselleştirici
                    </h1>
                    <p className="text-lg opacity-90" style={{ color: 'rgba(255,255,255,0.9)' }}>
                        Düz bir resmi 3 boyutlu dikdörtgen prizma şeklinde görselleştirin.
                    </p>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex flex-wrap gap-4 items-center justify-center">
                        {/* Upload Button */}
                        <label
                            className="flex items-center gap-2 px-6 py-3 rounded-lg cursor-pointer font-bold transition-all hover:scale-105"
                            style={{ backgroundColor: '#4f46e5', color: 'white' }}
                        >
                            <Upload size={20} />
                            Resim Yükle
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </label>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveImage}
                            disabled={!uploadedImage}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: uploadedImage ? '#10b981' : '#9ca3af',
                                color: 'white'
                            }}
                        >
                            <Download size={20} />
                            Kaydet
                        </button>

                        {/* Reset Button */}
                        <button
                            onClick={handleReset}
                            disabled={!uploadedImage}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: uploadedImage ? '#ef4444' : '#9ca3af',
                                color: 'white'
                            }}
                        >
                            <RotateCcw size={20} />
                            Sıfırla
                        </button>
                    </div>

                    {isLoading && (
                        <div className="text-center mt-4 text-gray-600">
                            Resim yükleniyor...
                        </div>
                    )}
                </div>

                {/* Canvas Container */}
                <div className="bg-white rounded-xl shadow-lg p-4 overflow-hidden">
                    <div className="relative flex items-center justify-center min-h-[400px] md:min-h-[500px]">
                        {!uploadedImage && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                                <ImageIcon size={64} className="mb-4 opacity-50" />
                                <p className="text-lg">Bir resim yükleyin</p>
                                <p className="text-sm opacity-75 mt-1">
                                    3D prizma üzerinde görselleştirilecek
                                </p>
                            </div>
                        )}
                        <canvas
                            ref={canvasRef}
                            className="max-w-full h-auto"
                            style={{
                                display: 'block',
                                borderRadius: '8px'
                            }}
                        />
                    </div>
                </div>

                {/* Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-blue-800">
                        <strong>Not:</strong> Yüklenen resim otomatik olarak prizmanın ön, üst ve yan yüzlerine
                        kesintisiz şekilde kaplanır. "Kaydet" butonuyla sonucu PNG olarak indirebilirsiniz.
                    </p>
                </div>
            </div>
        </PageContainer>
    );
}
