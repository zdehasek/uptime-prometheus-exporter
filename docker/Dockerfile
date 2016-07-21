FROM centos:centos7

# This image provides a Node.JS environment you can use to run your Node.JS
# applications.

MAINTAINER Zdenek Hasek <zdehasek@gmail.com>

EXPOSE 8080

ENV NODEJS_VERSION 6.2.1
RUN mv /usr/share/zoneinfo/Europe/Prague /etc/localtime

RUN yum -y install epel-release.noarch && \
    yum -y install tar wget git openssh-clients curl && \
    yum -y clean all

# Install Node.js and npm
RUN mkdir -p /src/node
RUN cd /src/node && wget https://nodejs.org/dist/v6.2.1/node-v6.2.1-linux-x64.tar.xz
RUN cd /src/node && tar xf node-v6.2.1-linux-x64.tar.xz
RUN cp -a /src/node/node-v6.2.1-linux-x64/* /usr/local/

# App
RUN mkdir /opt/app-root/

RUN chown -R 1001:0 /opt/app-root

RUN git clone https://github.com/Storyous/uptime-prometheus-exporter /opt/app-root

RUN cd /opt/app-root && npm install npm && npm install --production

USER 1001

WORKDIR /opt/app-root

CMD /usr/local/bin/node /opt/app-root/bin/run.js
