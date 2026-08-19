const arr=value=>Array.isArray(value)?value:[];

export const OUTFIT_MIN_ITEMS=2;

export function outfitIntegrity(outfit={},items=[]){
  const byId=new Map(arr(items).filter(Boolean).map(item=>[String(item.id),item]));
  const requestedIds=[...new Set(arr(outfit.itemIds).map(String).filter(Boolean))];
  const resolvedItems=requestedIds.map(id=>byId.get(id)).filter(Boolean);
  const resolvedIds=resolvedItems.map(item=>String(item.id));
  const missingItemIds=requestedIds.filter(id=>!byId.has(id));
  const incomplete=resolvedItems.length<OUTFIT_MIN_ITEMS;
  return {
    state:incomplete?'incomplete':'complete',
    incomplete,
    complete:!incomplete,
    itemCount:resolvedItems.length,
    minimumItemCount:OUTFIT_MIN_ITEMS,
    requestedItemIds:requestedIds,
    resolvedItemIds:resolvedIds,
    missingItemIds,
    items:resolvedItems
  };
}

export function completeOutfits(outfits=[],items=[]){
  return arr(outfits).filter(outfit=>outfitIntegrity(outfit,items).complete);
}
