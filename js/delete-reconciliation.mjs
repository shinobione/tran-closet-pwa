export function reconcileDeleteResults(mutations,results,canonicalRecordIds){
  const canonical=canonicalRecordIds instanceof Set?canonicalRecordIds:new Set(canonicalRecordIds||[]);
  const byMutation=new Map((mutations||[]).map(mutation=>[mutation?.id,mutation]));
  return (results||[]).map(result=>{
    const mutation=byMutation.get(result?.mutationId);
    if(result?.ok||mutation?.operation!=='delete'||!mutation.airtableRecordId||canonical.has(mutation.airtableRecordId))return result;
    const {error,...rest}=result||{};
    return {
      ...rest,
      ok:true,
      reconciled:true,
      reconciliation:'canonical-absent',
      airtableRecordId:mutation.airtableRecordId,
      originalError:error||null
    };
  });
}
