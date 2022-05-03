FROM zokrates/zokrates:0.7.13

USER root
RUN apt update
RUN apt install -y curl git git-lfs

USER zokrates
SHELL ["/bin/bash", "-c", "-l"]
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
ENV NVM_DIR="/home/zokrates/.nvm"
RUN echo "[ -s \"$NVM_DIR/nvm.sh\" ] && \. \"$NVM_DIR/nvm.sh\"" >> "$HOME/.bashrc"
RUN . "$HOME/.bashrc"
RUN nvm install 14
RUN npm install -g yarn lerna
