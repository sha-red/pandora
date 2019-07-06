FROM 0x2620/pandora-base:latest

LABEL maintainer="0x2620@0x2620.org"

ENV LANG en_US.UTF-8

#VOLUME /pandora
COPY . /srv/pandora
RUN /srv/pandora/docker/install.sh

ENTRYPOINT [ "/entrypoint.sh" ]
