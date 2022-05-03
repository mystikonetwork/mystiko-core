FROM zokrates/zokrates:0.7.13

USER root
RUN apt update
RUN apt install -y curl git git-lfs
ENV NVM_DIR=/root/.nvm
ENV NODE_VERSION=14.19.1
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash \
     && . $NVM_DIR/nvm.sh \
     && nvm install $NODE_VERSION \
     && nvm alias default $NODE_VERSION \
     && nvm use default \
     && npm install -g yarn lerna
WORKDIR /root
ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/$NODE_VERSION/bin:$PATH
