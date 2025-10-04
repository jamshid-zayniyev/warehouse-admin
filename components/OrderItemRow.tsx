// OrderItemRow komponenti - alohida fayl yoki bir xil fayl ichida
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";

interface OrderItemRowProps {
    item: any;
    order: any;
    onQuantityUpdate: () => void;
}

const OrderItemRow: React.FC<OrderItemRowProps> = ({ item, order, onQuantityUpdate }) => {
    
    const [quantity, setQuantity] = useState(item.quantity);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Product nomi orqali highlight qilish (asosiy product bilan solishtirish)
    const shouldHighlight = () => {
        // Bu yerda asosiy product bilan solishtirish mantiqini qo'shing
        // Masalan: item.product === asosiyProductName
        return false; // Hozircha false qaytaryapmiz
    };

    const handleSave = async () => {
        if (quantity < 0) {
            toast({
                title: "Error",
                description: "Quantity cannot be negative",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await authService.makeAuthenticatedRequest(
                `/order/item/${item.id}/update-quantity/`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        quantity: quantity
                    })
                }
            );

            if (!response.ok) throw new Error("Failed to update quantity");

            toast({
                title: "Success",
                description: "Quantity updated successfully",
            });

            setIsEditing(false);
            onQuantityUpdate(); // Parent komponentga yangilanish haqida xabar berish
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update quantity",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setQuantity(item.quantity);
        setIsEditing(false);
    };

    return (
        <div 
            className={`flex items-center gap-4 p-4 border rounded-lg ${
                shouldHighlight() ? 'bg-yellow-50 border-yellow-200' : ''
            }`}
        >
            {item.images?.[0] && (
                <img
                    src={item.images[0]}
                    alt={item.product}
                    className="h-16 w-16 object-cover rounded"
                />
            )}
            <div className="flex-1">
                <div className="font-medium">{item.product}</div>
                <div className="text-sm text-muted-foreground">
                    Price: ${parseFloat(item.price).toFixed(2)}
                </div>
                {item.color && (
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">Color:</span>
                        <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: item.color }}
                        />
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <>
                        <Input
                            type="number"
                            min="0"
                            value={quantity}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value >= 0) {
                                    setQuantity(value);
                                }
                            }}
                            className="w-20"
                            disabled={isLoading}
                        />
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? "Saving..." : "Save"}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="text-right min-w-20">
                            <div className="font-medium">Quantity: {quantity}</div>
                            <div className="font-medium">${(parseFloat(item.price) * quantity).toFixed(2)}</div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderItemRow;