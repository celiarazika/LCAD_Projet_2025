# Déploiement sur Google Cloud Platform

Ce guide explique comment déployer votre application Steam Games Database sur Google Cloud Platform.

## Option 1 : Cloud Run (Recommandé - Serverless)

Cloud Run est idéal pour des applications qui n'ont pas besoin d'une base de données MongoDB persistante sur le cloud.

### Prérequis
- Compte Google Cloud Platform
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installé
- Docker installé localement

### Étapes de déploiement

1. **Se connecter à Google Cloud**
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

2. **Activer les APIs nécessaires**
```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

3. **Build et push de l'image Docker**
```bash
# Build l'image
docker build -t gcr.io/YOUR_PROJECT_ID/steam-games-app .

# Push vers Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/steam-games-app
```

4. **Déployer sur Cloud Run**
```bash
gcloud run deploy steam-games-app \
  --image gcr.io/YOUR_PROJECT_ID/steam-games-app \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1
```

**Note:** Avec Cloud Run, vous aurez besoin d'une base MongoDB externe (MongoDB Atlas recommandé).

---

## Option 2 : Google Kubernetes Engine (GKE)

Pour une application avec MongoDB intégré et plus de contrôle.

### Prérequis
- kubectl installé
- Cluster GKE créé

### Étapes de déploiement

1. **Créer un cluster GKE**
```bash
gcloud container clusters create steam-games-cluster \
  --num-nodes=2 \
  --zone=europe-west1-b \
  --machine-type=e2-medium
```

2. **Configurer kubectl**
```bash
gcloud container clusters get-credentials steam-games-cluster \
  --zone=europe-west1-b
```

3. **Build et push l'image**
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/steam-games-app .
docker push gcr.io/YOUR_PROJECT_ID/steam-games-app
```

4. **Créer les fichiers Kubernetes**

Créez `k8s-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: steam-games-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: steam-games
  template:
    metadata:
      labels:
        app: steam-games
    spec:
      containers:
      - name: app
        image: gcr.io/YOUR_PROJECT_ID/steam-games-app
        ports:
        - containerPort: 3000
        env:
        - name: MONGO_URL
          value: "mongodb://mongodb-service:27017"
---
apiVersion: v1
kind: Service
metadata:
  name: steam-games-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: steam-games
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7.0
        ports:
        - containerPort: 27017
        volumeMounts:
        - name: mongodb-storage
          mountPath: /data/db
      volumes:
      - name: mongodb-storage
        persistentVolumeClaim:
          claimName: mongodb-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb-service
spec:
  ports:
  - port: 27017
  selector:
    app: mongodb
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

5. **Déployer sur Kubernetes**
```bash
kubectl apply -f k8s-deployment.yaml
```

6. **Obtenir l'IP externe**
```bash
kubectl get service steam-games-service
```

---

## Option 3 : Compute Engine avec Docker Compose

Pour une VM traditionnelle avec docker-compose.

### Étapes de déploiement

1. **Créer une instance VM**
```bash
gcloud compute instances create steam-games-vm \
  --zone=europe-west1-b \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server
```

2. **Créer une règle de firewall**
```bash
gcloud compute firewall-rules create allow-http \
  --allow tcp:3000 \
  --target-tags http-server
```

3. **Se connecter à la VM**
```bash
gcloud compute ssh steam-games-vm --zone=europe-west1-b
```

4. **Sur la VM, installer Docker et Docker Compose**
```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

5. **Cloner votre projet**
```bash
git clone https://github.com/celiarazika/LCAD_Projet_2025.git
cd LCAD_Projet_2025
```

6. **Démarrer avec Docker Compose**
```bash
sudo docker compose up -d
```

7. **Importer les données**
```bash
sudo docker compose exec app node scripts/migrate_to_mongodb.js
```

8. **Obtenir l'IP externe**
```bash
gcloud compute instances describe steam-games-vm \
  --zone=europe-west1-b \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

Votre application sera accessible sur `http://EXTERNAL_IP:3000`

---

## Recommandation : Cloud Run + MongoDB Atlas

**Configuration optimale:**

1. **Déployer l'app sur Cloud Run** (serverless, auto-scaling)
2. **Utiliser MongoDB Atlas** (base de données managée gratuite)

### Configuration MongoDB Atlas

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster gratuit (M0)
3. Obtenez votre connection string
4. Déployez sur Cloud Run avec la variable d'environnement:

```bash
gcloud run deploy steam-games-app \
  --image gcr.io/YOUR_PROJECT_ID/steam-games-app \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/steamGamesDB"
```

---

## Coûts estimés

- **Cloud Run**: ~5€/mois (usage modéré)
- **GKE**: ~60€/mois (cluster + ressources)
- **Compute Engine**: ~20€/mois (e2-medium)
- **MongoDB Atlas**: Gratuit (M0) ou ~10€/mois (M10)

---

## Dépannage

### Problème de connexion MongoDB
Vérifiez que la variable d'environnement `MONGO_URL` est correctement configurée.

### Application ne démarre pas
Vérifiez les logs:
```bash
gcloud run logs read --service steam-games-app
```

### Port non accessible
Assurez-vous que le port 3000 est exposé et que les règles de firewall sont configurées.

---

## Support

Pour plus d'informations:
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
