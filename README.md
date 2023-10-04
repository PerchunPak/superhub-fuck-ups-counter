# [Superhub](https://superhub.host)'s fuck-ups counter

We basically track the stability of their nodes, so you can know which is the stablest one.

## How to build an image

```shell
sudo docker build --build-arg='REDIS_URL=https://???.upstash.io' --build-arg='REDIS_TOKEN=******' -t superhub-fuck-ups-counter .
sudo docker run -d --name superhub-fuck-ups-counter -p 3000:3000 sfuc
```

Your credentials are hardcoded into the output, so be sure to not share with someone prebuilt image.
