import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Upload, Download, Image as ImageIcon, RotateCcw } from 'lucide-react';

/**
 * Prizma3D - 3D Box Texture Wrapper
 * 
 * Creates a 3D rectangular prism visualization with a user-uploaded image
 * wrapped seamlessly across the top, front, and right side faces.
 * Uses pure Canvas 2D for isometric projection (no WebGL library needed).
 */

export function Prizma3D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Prism dimensions (relative units)
    const PRISM = {
        width: 300,   // front face width
        height: 200,  // front face height  
        depth: 180,   // side depth
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

        // Center position
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2 + 50;

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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.moveTo(frontBottomLeft.x + 20, centerY + 20);
        ctx.lineTo(frontBottomRight.x + 20, centerY + 20);
        ctx.lineTo(rightBackBottom.x + 20, rightBackBottom.y + 20);
        ctx.lineTo(topBackLeft.x + 20, centerY - isoY + 20);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Function to draw a face with texture
        const drawFace = (
            points: { x: number; y: number }[],
            lightness: number,
            texCoords?: { sx: number; sy: number; sw: number; sh: number }
        ) => {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.clip();

            if (uploadedImage && texCoords) {
                // Calculate bounding box of the face
                const minX = Math.min(...points.map(p => p.x));
                const maxX = Math.max(...points.map(p => p.x));
                const minY = Math.min(...points.map(p => p.y));
                const maxY = Math.max(...points.map(p => p.y));
                const faceWidth = maxX - minX;
                const faceHeight = maxY - minY;

                // Draw the texture
                ctx.drawImage(
                    uploadedImage,
                    texCoords.sx, texCoords.sy, texCoords.sw, texCoords.sh,
                    minX, minY, faceWidth, faceHeight
                );

                // Apply lighting overlay
                ctx.fillStyle = `rgba(0, 0, 0, ${1 - lightness})`;
                ctx.fillRect(minX, minY, faceWidth, faceHeight);
            } else {
                // No texture - draw placeholder color
                ctx.fillStyle = `hsl(270, 30%, ${lightness * 100}%)`;
                ctx.fillRect(
                    Math.min(...points.map(p => p.x)),
                    Math.min(...points.map(p => p.y)),
                    Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x)),
                    Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y))
                );
            }

            ctx.restore();

            // Draw border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.stroke();
        };

        // Get texture coordinates for each face
        // We split the source image into regions for each face
        const imgW = uploadedImage?.width || 1;
        const imgH = uploadedImage?.height || 1;

        // Front face: center portion of image
        const frontTex = { sx: imgW * 0.1, sy: imgH * 0.2, sw: imgW * 0.5, sh: imgH * 0.6 };
        // Top face: upper portion
        const topTex = { sx: imgW * 0.15, sy: 0, sw: imgW * 0.7, sh: imgH * 0.4 };
        // Right face: right portion
        const rightTex = { sx: imgW * 0.5, sy: imgH * 0.15, sw: imgW * 0.4, sh: imgH * 0.7 };

        // Draw faces in back-to-front order (painter's algorithm)
        // 1. Right side face (darkest)
        drawFace(
            [frontBottomRight, frontTopRight, topBackRight, rightBackBottom],
            0.7,
            rightTex
        );

        // 2. Top face (medium)
        drawFace(
            [frontTopLeft, frontTopRight, topBackRight, topBackLeft],
            0.9,
            topTex
        );

        // 3. Front face (brightest)
        drawFace(
            [frontBottomLeft, frontBottomRight, frontTopRight, frontTopLeft],
            1.0,
            frontTex
        );

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
