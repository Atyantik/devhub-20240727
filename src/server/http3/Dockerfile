# Use the official Alpine Linux base image
FROM alpine:3.19 AS base

# Install dependencies for building NGINX with HTTP/3 support
RUN apk update && apk add --no-cache \
    gcc \
    libc-dev \
    make \
    musl-dev \
    go \
    ninja \
    mercurial \
    openssl-dev \
    pcre-dev \
    zlib-dev \
    linux-headers \
    gnupg \
    libxslt-dev \
    gd-dev \
    geoip-dev \
    perl-dev \
    autoconf \
    libtool \
    automake \
    git \
    g++ \
    cmake \
    libmaxminddb-dev \
    readline-dev

# Set working directory
WORKDIR /usr/src/

# Clone and build NGINX with QUIC and HTTP/3 support
RUN hg clone -b default --rev ff0312de0112 https://hg.nginx.org/nginx-quic /usr/src/nginx-1.27.0

# Clone and build Brotli module
RUN mkdir /usr/src/ngx_brotli && \
    cd /usr/src/ngx_brotli && \
    git init && \
    git remote add origin https://github.com/google/ngx_brotli.git && \
    git fetch --depth 1 origin a71f9312c2deb28875acc7bacfdd5695a111aa53 && \
    git checkout --recurse-submodules -q FETCH_HEAD && \
    git submodule update --init --depth 1

# Download and prepare headers-more-nginx-module
RUN cd /usr/src && \
    wget -q https://github.com/openresty/headers-more-nginx-module/archive/refs/tags/v0.37.tar.gz -O headers-more-nginx-module.tar.gz && \
    tar -xf headers-more-nginx-module.tar.gz

# Download and prepare ngx_http_geoip2_module
RUN git clone --depth 1 --branch 3.4 https://github.com/leev/ngx_http_geoip2_module /usr/src/ngx_http_geoip2_module

# Clone and build njs
RUN cd /usr/src && \
    hg clone --rev 7133f0400019 http://hg.nginx.org/njs && \
    cd /usr/src/njs && \
    ./configure && \
    make njs && \
    mv /usr/src/njs/build/njs /usr/sbin/njs && \
    echo "njs v$(njs -v)"

# Build NGINX with QUIC, HTTP/3, Brotli, and other modules
RUN cd /usr/src/nginx-1.27.0 && \
    ./auto/configure \
        --build=quic-ff0312de0112 \
        --prefix=/etc/nginx \
        --sbin-path=/usr/sbin/nginx \
        --modules-path=/usr/lib/nginx/modules \
        --conf-path=/etc/nginx/nginx.conf \
        --error-log-path=/var/log/nginx/error.log \
        --http-log-path=/var/log/nginx/access.log \
        --pid-path=/var/run/nginx/nginx.pid \
        --lock-path=/var/run/nginx/nginx.lock \
        --http-client-body-temp-path=/var/cache/nginx/client_temp \
        --http-proxy-temp-path=/var/cache/nginx/proxy_temp \
        --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp \
        --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp \
        --http-scgi-temp-path=/var/cache/nginx/scgi_temp \
        --user=nginx \
        --group=nginx \
        --with-http_ssl_module \
        --with-http_realip_module \
        --with-http_addition_module \
        --with-http_sub_module \
        --with-http_dav_module \
        --with-http_flv_module \
        --with-http_mp4_module \
        --with-http_gunzip_module \
        --with-http_gzip_static_module \
        --with-http_random_index_module \
        --with-http_secure_link_module \
        --with-http_stub_status_module \
        --with-http_auth_request_module \
        --with-http_xslt_module=dynamic \
        --with-http_image_filter_module=dynamic \
        --with-http_geoip_module=dynamic \
        --with-http_perl_module=dynamic \
        --with-threads \
        --with-stream \
        --with-stream_ssl_module \
        --with-stream_ssl_preread_module \
        --with-stream_realip_module \
        --with-stream_geoip_module=dynamic \
        --with-http_slice_module \
        --with-mail \
        --with-mail_ssl_module \
        --with-compat \
        --with-file-aio \
        --with-http_v2_module \
        --with-http_v3_module \
        --add-module=/usr/src/ngx_brotli \
        --add-module=/usr/src/headers-more-nginx-module-0.37 \
        --add-module=/usr/src/njs/nginx \
        --add-dynamic-module=/usr/src/ngx_http_geoip2_module && \
    make -j"$(getconf _NPROCESSORS_ONLN)" && \
    make install

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /etc/nginx/ssl && \
    wget -q https://ssl-config.mozilla.org/ffdhe2048.txt -O /etc/ssl/dhparam.pem

# Set up runtime dependencies
RUN apk add --no-cache --virtual .gettext gettext && \
    scanelf --needed --nobanner /usr/sbin/nginx /usr/sbin/njs /usr/lib/nginx/modules/*.so /usr/bin/envsubst \
        | awk '{ gsub(/,/, "\nso:", $2); print "so:" $2 }' \
        | sort -u \
        | xargs -r apk info --installed \
        | sort -u > /tmp/runDeps.txt

FROM alpine:3.19

# Copy necessary files from the build stage
COPY --from=base /var/run/nginx/ /var/run/nginx/
COPY --from=base /tmp/runDeps.txt /tmp/runDeps.txt
COPY --from=base /etc/nginx /etc/nginx
COPY --from=base /usr/lib/nginx/modules/*.so /usr/lib/nginx/modules/
COPY --from=base /usr/sbin/nginx /usr/sbin/
COPY --from=base /usr/local/lib/perl5/site_perl /usr/local/lib/perl5/site_perl
COPY --from=base /usr/bin/envsubst /usr/local/bin/envsubst
COPY --from=base /etc/ssl/dhparam.pem /etc/nginx/ssl/dhparam.pem
COPY --from=base /usr/sbin/njs /usr/sbin/njs

# Add nginx user and group
RUN addgroup --gid 101 -S nginx && \
    adduser --uid 100 -D -S -h /var/cache/nginx -s /sbin/nologin -G nginx nginx && \
    apk add --no-cache --virtual .nginx-rundeps tzdata $(cat /tmp/runDeps.txt) && \
    rm /tmp/runDeps.txt && \
    ln -s /usr/lib/nginx/modules /etc/nginx/modules && \
    mkdir /var/log/nginx && \
    touch /var/log/nginx/access.log /var/log/nginx/error.log && \
    ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

# Copy configuration files
COPY ./src/server/http3/nginx.conf /etc/nginx/nginx.conf
COPY ./ssl/server-cert.pem /etc/nginx/ssl/server-cert.pem
COPY ./ssl/server-key.pem /etc/nginx/ssl/server-key.pem
COPY ./src/server/http3/ssl_common.conf /etc/nginx/conf.d/ssl_common.conf
COPY ./src/server/http3/server.conf /etc/nginx/conf.d/server.conf

# Set permissions for SSL certificates
RUN chown nginx:nginx /etc/nginx/ssl/server-cert.pem /etc/nginx/ssl/server-key.pem

# Show environment variables
RUN env | sort

# Verify njs version
RUN njs -v

# Test the NGINX configuration
RUN nginx -V && nginx -t

# Expose ports
EXPOSE 8080 8443

STOPSIGNAL SIGTERM

# Set permissions and switch to non-root user
RUN chown -R nginx:nginx /var/run/nginx/ /var/cache/nginx /var/log/nginx

USER nginx
CMD ["nginx", "-g", "daemon off;"]
