FROM debian:12

LABEL maintainer="0x2620@0x2620.org"

ENV LANG en_US.UTF-8

RUN apt-get update && \
    LANG=C.UTF-8 DEBIAN_FRONTEND=noninteractive apt-get install -y apt-utils locales && \
    echo en_US.UTF-8 UTF-8 > /etc/locale.gen && \
    locale-gen en_US.UTF-8 && \
    update-locale LANG=en_US.UTF-8

COPY ./install.sh /install.sh
RUN /install.sh
