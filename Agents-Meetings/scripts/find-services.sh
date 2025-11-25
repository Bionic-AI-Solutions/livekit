#!/bin/bash
# Helper script to find service names in the cluster

echo "=== Finding Pre-existing Services ==="
echo ""

echo "--- All Services (across all namespaces) ---"
kubectl get svc --all-namespaces | grep -E "livekit|postgres|redis|langfuse" || echo "No matching services found"

echo ""
echo "--- Services in default namespace ---"
kubectl get svc -n default 2>/dev/null | grep -E "livekit|postgres|redis|langfuse" || echo "No matching services in default namespace"

echo ""
echo "--- Services in common namespaces ---"
for ns in livekit langfuse postgres redis database infrastructure; do
    echo "Namespace: $ns"
    kubectl get svc -n "$ns" 2>/dev/null | grep -v "^NAME" || echo "  (namespace does not exist or no services)"
    echo ""
done

echo ""
echo "=== Service Name Format Guide ==="
echo ""
echo "For services in the SAME namespace (meeting-platform):"
echo "  Use: service-name"
echo "  Example: livekit-service"
echo ""
echo "For services in DIFFERENT namespaces:"
echo "  Use: service-name.namespace.svc.cluster.local"
echo "  Example: livekit-service.default.svc.cluster.local"
echo ""
echo "For EXTERNAL services:"
echo "  Use: full URL"
echo "  Example: https://livekit.example.com"
echo ""






