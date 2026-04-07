

interface Attribute {
  label: string
  value: any
}


function PropertyListCard({attributes}: {attributes: any[]}){

    const displayAttributes = attributes.slice(0,7)

    return(

        <table className="attr-table">
                <tbody>
                  {displayAttributes.map((attr: Attribute, i: number) => (
                    <tr key={i}>
                      <td className="attr-label">{attr.label}</td>
                      <td className="attr-value">{attr.value ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
    );
}
export default PropertyListCard;
