# Backend API Requirements for Server-Side Pagination

## Current Implementation
The product assignment modal has been updated to use server-side pagination instead of client-side filtering. Here are the backend changes needed:

## API Endpoint: GET /api/products

### Required Query Parameters:
- `page`: Page number (1-based)
- `limit`: Number of items per page
- `search`: Search term for product names
- `sku`: Filter by SKU (optional)
- `exclude_category`: Category ID to exclude products already assigned (optional)

### Required Response Format:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": {
        "ar": "اسم المنتج",
        "en": "Product Name"
      },
      "sku": "SKU123",
      "price": 100,
      "image_url": "https://example.com/image.jpg"
    }
  ],
  "total": 150,
  "totalPages": 15,
  "currentPage": 1,
  "limit": 10
}
```

### Benefits:
1. **Performance**: Faster loading for large product databases
2. **Memory**: Reduced memory usage on frontend
3. **Network**: Smaller data transfer
4. **User Experience**: Faster initial load and pagination

### Frontend Changes Made:
1. ✅ Added state for `totalProducts` and `totalPages`
2. ✅ Updated `loadProducts` to use server pagination parameters
3. ✅ Removed client-side filtering logic
4. ✅ Updated pagination controls to work with server data
5. ✅ Added debounced search functionality
6. ✅ Fixed page reset logic for search and filters

### Next Steps:
1. Update the backend API to support the new parameters
2. Ensure the API returns the required pagination metadata
3. Test the integration between frontend and backend
4. Optimize database queries for better performance
