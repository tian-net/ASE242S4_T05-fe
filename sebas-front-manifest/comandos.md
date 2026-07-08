# Despliegue Frontend - ElChino

## Build de la imagen Docker
```bash
# Desde la raíz de front-chino
docker build -t luisfelipe1432/frontend-nosql:1.0 .
docker push luisfelipe1432/frontend-nosql:1.0
```

## Aplicar manifiestos
```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

## Verificar
```bash
kubectl get all -n elchino -l app=front-chino
```

## Acceso
```
http://IP_PUBLICA_EC2:30080
```
