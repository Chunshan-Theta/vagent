FROM node:20-alpine AS base
COPY . /app

WORKDIR /app
RUN apk add --no-cache postgresql-client ffmpeg
# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY

# Build the application
RUN npm install
RUN npm run build
RUN chmod +x /app/scripts/init-db.sh

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["/bin/sh", "-c", "/app/scripts/init-db.sh && npm run start"]
