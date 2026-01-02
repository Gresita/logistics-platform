import { useParams } from "react-router-dom";

export default function ShipmentDetails() {
  const { id } = useParams();
  return <div style={{ padding: 24 }}>Shipment Details: {id}</div>;
}
